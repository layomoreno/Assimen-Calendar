"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Mic, Square, Loader2, CalendarCheck, Edit3, Check,
  Calendar, Clock, X, MapPin, Tag, MessageCircle, HelpCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { AIExtractionResult } from "@/types/database";

// Global audio elements for TTS to prevent overlapping
let currentAudio: HTMLAudioElement | null = null;

// ── Speech helpers (ElevenLabs TTS) ─────────────────────────────────────────
async function speak(text: string, onEnd?: () => void) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  try {
    const response = await fetch("/api/ai/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("TTS API Error");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      if (onEnd) onEnd();
    };

    await audio.play();
  } catch (error) {
    console.error("TTS failed, falling back to browser speech", error);
    // Fallback to browser TTS if ElevenLabs fails
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "es-ES";
      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find(v => v.lang.startsWith("es"));
      if (esVoice) utter.voice = esVoice;
      if (onEnd) utter.onend = onEnd;
      window.speechSynthesis.speak(utter);
    } else {
      if (onEnd) onEnd();
    }
  }
}

// ── Component ───────────────────────────────────────────────────────────────
export function VoiceAssistant() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [aiResult, setAiResult] = useState<AIExtractionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conversational follow-up state
  const [pendingFollowUp, setPendingFollowUp] = useState<string | null>(null); // voice msg to play
  const [accumulatedContext, setAccumulatedContext] = useState<string>(""); // text context across turns

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  // VAD state refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false); // To sync with state in callbacks
  const animationFrameRef = useRef<number | null>(null);

  // ── Vibration ──────────────────────────────────────────────────────────
  const triggerVibration = (pattern: number | number[] = 50) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // ── VAD (Silence Detection) ─────────────────────────────────────────────
  const setupVAD = (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.minDecibels = -80;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkSilence = () => {
        if (!isRecordingRef.current) return;

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // VAD Logic: If volume is very low (silence)
        const SILENCE_THRESHOLD = 8; // Adjust based on mic sensitivity
        const MAX_SILENCE_MS = 2000; // 2 seconds of silence stops recording

        if (average < SILENCE_THRESHOLD) {
          if (silenceStartRef.current === null) {
            silenceStartRef.current = Date.now();
          } else if (Date.now() - silenceStartRef.current > MAX_SILENCE_MS) {
            // Silence limit reached, auto-stop
            stopRecording();
            return;
          }
        } else {
          // Voice detected, reset silence timer
          silenceStartRef.current = null;
        }

        animationFrameRef.current = requestAnimationFrame(checkSilence);
      };

      // Start VAD loop
      silenceStartRef.current = null; // Start with no silence
      checkSilence();
    } catch (e) {
      console.warn("VAD not supported", e);
    }
  };

  const cleanupVAD = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    silenceStartRef.current = null;
  };

  // ── Start Recording ────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      // Greet the user with TTS before the microphone opens
      setIsSpeaking(true);
      const greeting = pendingFollowUp
        ? pendingFollowUp  // AI has a specific follow-up question
        : "Dime tu recordatorio, tarea o actividad, con gusto lo gestionaré por ti.";

      speak(greeting, async () => {
        setIsSpeaking(false);
        try {
          triggerVibration([50, 100, 50]);
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
          };

          mediaRecorder.onstop = async () => {
            cleanupVAD();
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            await processAudio(audioBlob);
            stream.getTracks().forEach(t => t.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          isRecordingRef.current = true;
          setError(null);
          
          setupVAD(stream);
        } catch (err) {
          console.error("Mic error:", err);
          setError("No se pudo acceder al micrófono. Verifica los permisos.");
        }
      });
    } catch (err) {
      console.error("TTS error, starting mic directly:", err);
      setIsSpeaking(false);
      startMicDirectly();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFollowUp]);

  const startMicDirectly = async () => {
    try {
      triggerVibration([50, 100, 50]);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        cleanupVAD();
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      setError(null);
      
      setupVAD(stream);
    } catch (err) {
      console.error("Mic error:", err);
      setError("No se pudo acceder al micrófono. Verifica los permisos.");
    }
  };

  // ── Stop Recording ─────────────────────────────────────────────────────
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      triggerVibration(50);
      isRecordingRef.current = false;
      setIsRecording(false);
      mediaRecorderRef.current.stop();
      setIsProcessing(true);
    }
  };

  // ── Process Audio ──────────────────────────────────────────────────────
  const processAudio = async (audioBlob: Blob) => {
    try {
      const file = new File([audioBlob], "voice_memo.webm", { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", file);
      // Send accumulated context so Gemini can combine the new answer with prior context
      if (accumulatedContext) {
        formData.append("context", accumulatedContext);
      }

      const response = await fetch("/api/ai/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al procesar el audio");
      }

      const data = await response.json();
      const result: AIExtractionResult = data.result;

      // If AI needs more information → enter follow-up loop
      if (
        result.follow_up_questions.length > 0 &&
        result.follow_up_voice_message
      ) {
        setPendingFollowUp(result.follow_up_voice_message);
        // Accumulate context: merge old + new task titles
        const taskSummary = result.tasks.map(t => t.title).join(", ");
        setAccumulatedContext(prev => prev ? `${prev}. ${taskSummary}` : taskSummary);
        // Speak the follow-up question to guide the user
        speak(result.follow_up_voice_message);
      } else {
        // Everything is complete → show confirmation modal
        setPendingFollowUp(null);
        setAccumulatedContext("");
        setAiResult(result);
        setShowConfirmModal(true);
        // Speak a brief success confirmation
        speak("Listo, aquí está el resumen. Revísalo y confirma para agendarlo.");
      }
    } catch (err) {
      console.error("Audio processing error:", err);
      setError(err instanceof Error ? err.message : "Error al procesar el audio");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Confirm & Save ─────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!aiResult) return;
    setIsSaving(true);
    setError(null);

    try {
      const tasks = aiResult.tasks.map((task) => ({
        ...task,
        classification: aiResult.classification,
        course_name: aiResult.course_name,
      }));

      const response = await fetch("/api/activities/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, syncCalendar: true }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al crear actividades");
      }

      speak("¡Perfecto! Tu actividad fue guardada y agendada exitosamente.");
      triggerVibration([50, 50, 50, 50, 50]);
      setShowConfirmModal(false);
      setAiResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar actividades");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Event type label ───────────────────────────────────────────────────
  const eventTypeLabel: Record<string, string> = {
    tarea: "📚 Tarea",
    cita: "🩺 Cita",
    examen: "📝 Examen",
    reunion: "🤝 Reunión",
    evento: "🎉 Evento",
    recordatorio: "🔔 Recordatorio",
    otro: "📌 Otro",
  };

  const isIdle = !isRecording && !isProcessing && !isSpeaking;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Floating Mic Button */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
        {error && !showConfirmModal && (
          <div className="bg-status-danger text-white text-[10px] px-3 py-1.5 rounded-xl shadow-lg mb-2 flex items-center gap-2 max-w-[220px] animate-fade-in-up text-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-3 h-3" /></button>
          </div>
        )}

        {/* Follow-up prompt badge */}
        {pendingFollowUp && !isRecording && (
          <div className="bg-indigo-900/90 text-indigo-200 text-[10px] px-3 py-2 rounded-xl shadow-lg mb-2 flex items-center gap-2 max-w-[240px] animate-fade-in-up text-center border border-indigo-500/30 backdrop-blur-md">
            <HelpCircle className="w-3 h-3 shrink-0 text-indigo-400" />
            <span className="leading-snug">{pendingFollowUp}</span>
          </div>
        )}

        <div className="relative flex items-center justify-center">
          {/* Idle Aura */}
          {isIdle && (
            <div className="absolute inset-[-15px] pointer-events-none">
              <div className="absolute inset-0 rounded-full border border-dashed border-accent/40 animate-spin-slow" style={{ animationDuration: '8s' }} />
              <div className="absolute inset-1 rounded-full border-2 border-dotted border-accent2/30 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '12s' }} />
              <div className="absolute inset-[-10px] rounded-full bg-gradient-to-tr from-indigo-500/20 via-emerald-500/10 to-cyan-500/20 animate-breathe blur-md" />
            </div>
          )}

          {/* Speaking Aura */}
          {isSpeaking && (
            <div className="absolute inset-[-20px] pointer-events-none">
              <div className="absolute inset-4 rounded-full border-[3px] border-cyan-400 animate-ping opacity-75" style={{ animationDuration: '1.2s' }} />
              <div className="absolute inset-[-5px] rounded-full bg-cyan-500/20 blur-xl animate-pulse" />
            </div>
          )}

          {/* Recording Pulse */}
          {isRecording && (
            <div className="absolute inset-[-20px] pointer-events-none">
              <div className="absolute inset-5 rounded-full border-[3px] border-status-danger animate-ping opacity-75" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-1 rounded-full border border-status-danger/50 animate-ping opacity-50" style={{ animationDuration: '1.5s', animationDelay: "0.4s" }} />
              <div className="absolute inset-[-5px] rounded-full bg-status-danger/20 blur-xl animate-pulse" />
            </div>
          )}

          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing || isSpeaking}
            className={`
              relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 z-10
              ${(isProcessing || isSpeaking) ? "bg-bg-elevated cursor-not-allowed border border-border" : ""}
              ${isIdle ? "bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 bg-[length:200%_auto] animate-gradient hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(99,102,241,0.5)]" : ""}
              ${isRecording ? "bg-status-danger hover:scale-110 active:scale-95 shadow-[0_0_40px_rgba(248,113,113,0.6)]" : ""}
            `}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-accent animate-spin relative z-10" />
            ) : isSpeaking ? (
              <MessageCircle className="w-6 h-6 text-cyan-300 relative z-10 animate-pulse" />
            ) : isRecording ? (
              <Square className="w-6 h-6 text-white fill-white relative z-10" />
            ) : (
              <Mic className="w-7 h-7 text-white relative z-10" />
            )}
          </button>
        </div>

        {isRecording && (
          <span className="text-[10px] font-bold text-status-danger bg-bg-card/90 px-3 py-1.5 rounded-full backdrop-blur-md animate-breathe mt-2 shadow-lg border border-status-danger/20">
            Escuchando...
          </span>
        )}
        {isSpeaking && (
          <span className="text-[10px] font-bold text-cyan-400 bg-bg-card/90 px-3 py-1.5 rounded-full backdrop-blur-md animate-breathe mt-2 shadow-lg border border-cyan-500/20">
            Assisten está hablando...
          </span>
        )}
        {isProcessing && (
          <span className="text-[10px] font-bold text-accent bg-bg-card/90 px-3 py-1.5 rounded-full backdrop-blur-md animate-breathe mt-2 shadow-lg border border-accent/20">
            Analizando...
          </span>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Actividad Detectada por IA"
        size="lg"
      >
        {aiResult && (
          <div className="space-y-4">
            {error && (
              <div className="bg-status-danger/10 text-status-danger text-xs px-3 py-2 rounded-xl border border-status-danger/20">
                {error}
              </div>
            )}

            {/* Classification */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-border">
              <div className="flex items-center gap-2 flex-1">
                <Badge
                  variant={aiResult.classification === "academica" ? "academic" : "personal"}
                  size="md"
                >
                  {aiResult.classification === "academica" ? "Académica" : "Personal"}
                </Badge>
                {aiResult.course_name && (
                  <span className="text-sm font-bold text-text-primary">
                    {aiResult.course_name}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-text-muted">
                Precisión: {Math.round(aiResult.confidence * 100)}%
              </span>
            </div>

            {/* Extracted Tasks */}
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {aiResult.tasks.map((task, i) => (
                <Card key={i} padding="sm" className="border-border-light hover:border-accent/30 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-text-primary leading-tight">
                        {task.title}
                      </h4>
                      <button className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Event Type Badge */}
                    {task.event_type && (
                      <span className="inline-block text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20">
                        {eventTypeLabel[task.event_type] ?? task.event_type}
                      </span>
                    )}

                    {task.description && (
                      <p className="text-xs text-text-muted leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Location */}
                    {task.location && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{task.location}</span>
                      </div>
                    )}

                    {/* Date / Time */}
                    {task.due_date && (
                      <div className="flex items-center gap-3 text-[11px] font-medium text-text-secondary mt-2">
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-elevated">
                          <Calendar className="w-3 h-3 text-accent" />
                          {new Date(task.due_date).toLocaleDateString("es", {
                            weekday: "short", day: "numeric", month: "short",
                          })}
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-elevated">
                          <Clock className="w-3 h-3 text-accent2" />
                          {new Date(task.due_date).toLocaleTimeString("es", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}

                    {/* Subtasks */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="pt-3 mt-1 border-t border-border/50 space-y-1.5">
                        {task.subtasks.map((sub, j) => (
                          <div key={j} className="flex items-start gap-2 text-[11px] text-text-muted">
                            <div className="w-3.5 h-3.5 mt-0.5 rounded border border-border/70 flex items-center justify-center shrink-0">
                              <Check className="w-2 h-2 opacity-0" />
                            </div>
                            <span className="leading-snug">{sub}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Sync note */}
            <Card padding="sm" className="border-accent2/20 bg-accent2/5">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-accent2 shrink-0" />
                <p className="text-[11px] text-text-secondary leading-tight">
                  Las tareas se sincronizarán con <strong className="text-accent2">Google Calendar</strong> y se programarán los recordatorios automáticos (7/5/3/0 días).
                </p>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-3">
              <Button
                variant="ghost"
                className="flex-1 rounded-xl"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="flex-1 rounded-xl btn-gradient"
                onClick={handleConfirm}
                disabled={isSaving}
                icon={
                  isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )
                }
              >
                {isSaving ? "Guardando..." : "Confirmar y Agendar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
