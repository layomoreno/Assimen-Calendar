"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { DropZone } from "@/components/upload/DropZone";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import {
  Check,
  Edit3,
  BookOpen,
  Calendar,
  Clock,
  AlertCircle,
  Sparkles,
  CalendarCheck,
} from "lucide-react";
import type { AIExtractionResult } from "@/types/database";

export default function UploadPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiResult, setAiResult] = useState<AIExtractionResult | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFilesAccepted = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setSuccessMessage(null);

    // Animate progress while processing
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);

      const response = await fetch("/api/ai/process", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al procesar archivo");
      }

      setProgress(100);
      const data = await response.json();

      // Small delay for the animation to complete
      await new Promise((r) => setTimeout(r, 300));

      setAiResult(data.result);
      setShowConfirmModal(true);
    } catch (err) {
      clearInterval(progressInterval);
      setError(
        err instanceof Error ? err.message : "Error al procesar archivo"
      );
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

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

      const data = await response.json();

      setShowConfirmModal(false);
      setAiResult(null);
      setSuccessMessage(
        `✅ ${data.totalCreated} actividad(es) creada(s)${data.totalSynced > 0 ? ` y ${data.totalSynced} sincronizada(s) con Google Calendar` : ""}`
      );

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar actividades"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="Subir Archivo" subtitle="Procesamiento con IA" />

      <div className="px-4 py-6 space-y-6">
        {/* Success Message */}
        {successMessage && (
          <Card padding="md" className="border-status-active/30 bg-status-active/5 animate-fade-in">
            <div className="flex items-center gap-3">
              <CalendarCheck className="w-5 h-5 text-status-active shrink-0" />
              <p className="text-sm font-semibold text-status-active">
                {successMessage}
              </p>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card padding="md" className="border-status-danger/30 bg-status-danger/5 animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-status-danger shrink-0" />
              <div>
                <p className="text-sm font-semibold text-status-danger">
                  Error
                </p>
                <p className="text-xs text-text-muted mt-0.5">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card padding="md" className="border-accent/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                ¿Cómo funciona?
              </p>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Sube un archivo (PDF, imagen, Excel o TXT) y nuestra IA{" "}
                <strong className="text-accent">
                  <Sparkles className="w-3 h-3 inline" /> Gemini
                </strong>{" "}
                identificará automáticamente si es un{" "}
                <strong className="text-cat-academic">curso académico</strong> o
                una{" "}
                <strong className="text-cat-personal">
                  actividad cotidiana
                </strong>
                , extrayendo fechas, tareas y subtareas.
              </p>
            </div>
          </div>
        </Card>

        {/* Drop Zone */}
        <DropZone
          onFilesAccepted={handleFilesAccepted}
          isProcessing={isProcessing}
          processingProgress={Math.round(progress)}
        />

        {/* Supported Formats */}
        <div className="flex flex-wrap gap-2 justify-center">
          {["PDF", "JPG", "PNG", "XLSX", "TXT"].map((fmt) => (
            <span
              key={fmt}
              className="px-2.5 py-1 rounded-lg bg-bg-card border border-border text-[10px] font-semibold text-text-muted"
            >
              .{fmt.toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      {/* AI Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Datos Extraídos por IA"
        size="lg"
      >
        {aiResult && (
          <div className="space-y-4">
            {/* Classification */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-border">
              <div className="flex items-center gap-2 flex-1">
                <Badge
                  variant={
                    aiResult.classification === "academica"
                      ? "academic"
                      : "personal"
                  }
                  size="md"
                >
                  {aiResult.classification === "academica"
                    ? "Académica"
                    : "Personal"}
                </Badge>
                {aiResult.course_name && (
                  <span className="text-sm font-semibold text-text-primary">
                    {aiResult.course_name}
                  </span>
                )}
              </div>
              <span className="text-xs text-text-muted">
                Confianza: {Math.round(aiResult.confidence * 100)}%
              </span>
            </div>

            {/* Extracted Tasks */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {aiResult.tasks.map((task, i) => (
                <Card key={i} padding="sm" className="border-border-light">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-text-primary">
                        {task.title}
                      </h4>
                      <button className="p-1 rounded text-text-muted hover:text-accent transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-xs text-text-muted">
                        {task.description}
                      </p>
                    )}
                    {task.due_date && (
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-accent" />
                          {new Date(task.due_date).toLocaleDateString("es", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-accent" />
                          Bloque de 2h
                        </span>
                      </div>
                    )}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="pt-2 border-t border-border space-y-1">
                        {task.subtasks.map((sub, j) => (
                          <div
                            key={j}
                            className="flex items-center gap-2 text-xs text-text-muted"
                          >
                            <div className="w-3.5 h-3.5 rounded border border-border flex items-center justify-center">
                              <Check className="w-2 h-2 opacity-0" />
                            </div>
                            {sub}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Info about Calendar sync */}
            <Card padding="sm" className="border-accent/20 bg-accent/5">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-accent shrink-0" />
                <p className="text-xs text-text-secondary">
                  Al confirmar, las tareas se crearán en tu cuenta y se
                  sincronizarán automáticamente con{" "}
                  <strong className="text-accent">Google Calendar</strong> con
                  detección anti-colisiones.
                </p>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleConfirm}
                disabled={isSaving}
                icon={
                  isSaving ? (
                    <div className="w-4 h-4 border-2 border-text-on-accent/30 border-t-text-on-accent rounded-full animate-spin" />
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
    </div>
  );
}
