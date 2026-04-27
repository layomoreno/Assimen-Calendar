import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const EXTRACTION_PROMPT = `Eres Assisten, un asistente inteligente de agenda personal y académica. Tu función es analizar lo que el usuario dijo por voz y convertirlo en un recordatorio, tarea o evento bien estructurado.

FECHA Y HORA ACTUAL: ${new Date().toLocaleString("es", { timeZone: "America/Bogota", dateStyle: "full", timeStyle: "long" })} (ISO: ${new Date().toISOString()})

INSTRUCCIONES DETALLADAS:

1. CLASIFICACIÓN: Clasifica como "academica" si menciona un curso, materia, universidad o tarea escolar. De lo contrario, usa "personal".

2. EXTRACCIÓN DE CONTEXTO: Para cada tarea o evento, intenta extraer:
   - Título claro y conciso
   - Descripción REDACTADA de forma profesional, clara e informativa (si el usuario habló de forma informal, mejora la redacción)
   - Fecha y hora exacta (convierte expresiones como "mañana", "el viernes", "en dos horas" a fecha ISO)
   - Lugar o dirección (si se menciona)
   - Tipo de actividad (reunión, cita médica, entrega, examen, evento social, etc.)

3. PREGUNTAS DE SEGUIMIENTO: Si falta información CRÍTICA para crear el recordatorio correctamente, genera preguntas. Considera crítico:
   - Para citas/eventos: falta la hora específica
   - Para eventos presenciales: falta la dirección o lugar
   - Para tareas académicas: falta la fecha de entrega
   - Si la descripción es MUY vaga (menos de 5 palabras) o incomprensible
   Si NO falta nada importante, devuelve follow_up_questions como array vacío [].

4. MÚLTIPLES TAREAS: Si el usuario menciona varias actividades separadas, crea una entrada por cada una.

5. FECHAS: Siempre en formato ISO 8601. Si no se menciona hora, usa las 9:00 AM del día indicado.

Responde ÚNICAMENTE con JSON válido (sin markdown, sin backticks, sin comentarios) con este formato:
{
  "classification": "academica" | "personal",
  "course_name": "string o null",
  "tasks": [
    {
      "title": "string claro y conciso",
      "description": "string con redacción profesional y completa",
      "due_date": "ISO date string",
      "location": "string o null",
      "event_type": "tarea" | "cita" | "examen" | "reunion" | "evento" | "recordatorio" | "otro",
      "subtasks": ["string"]
    }
  ],
  "follow_up_questions": ["pregunta1", "pregunta2"],
  "follow_up_voice_message": "string: mensaje natural en español que la IA dirá en voz alta si necesita más info, o null si no necesita nada más",
  "confidence": 0.0
}

CONTENIDO A ANALIZAR:
`;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const priorContext = (formData.get("context") as string) || "";

    // If there's accumulated conversation context, prepend it to the prompt
    const buildPrompt = (extra?: string) =>
      EXTRACTION_PROMPT +
      (priorContext ? `\n[CONTEXTO PREVIO DE LA CONVERSACIÓN: ${priorContext}]\n` : "") +
      (extra ? extra : "");

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó archivo" },
        { status: 400 }
      );
    }

    // 1. Extract text from the file
    let fileText = "";

    if (
      file.type === "text/plain" ||
      file.type.includes("csv") ||
      file.type.includes("json")
    ) {
      fileText = await file.text();
    } else if (file.type === "application/pdf") {
      // For PDFs, we send the raw bytes to Gemini as inline data
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");

      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent([
        EXTRACTION_PROMPT,
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64,
          },
        },
      ]);

      const responseText = result.response.text();
      const aiResult = parseAIResponse(responseText);

      // Save upload record
      await saveUploadRecord(supabase, user.id, file, aiResult);

      return NextResponse.json({
        success: true,
        result: aiResult,
      });
    } else if (file.type.startsWith("image/") || file.type.startsWith("audio/") || file.type.startsWith("video/")) {
      // For images and audio, send as inline data to Gemini (OCR + analysis + transcription)
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");

      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent([
        buildPrompt(),
        {
          inlineData: {
            mimeType: file.type,
            data: base64,
          },
        },
      ]);

      const responseText = result.response.text();
      const aiResult = parseAIResponse(responseText);

      await saveUploadRecord(supabase, user.id, file, aiResult);

      return NextResponse.json({
        success: true,
        result: aiResult,
      });
    } else {
      // For other file types, try to extract text
      fileText = await file.text();
    }

    // 2. Process text with Gemini
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const result = await model.generateContent(
      EXTRACTION_PROMPT + fileText.substring(0, 30000)
    );

    const responseText = result.response.text();
    const aiResult = parseAIResponse(responseText);

    // 3. Save upload record
    await saveUploadRecord(supabase, user.id, file, aiResult);

    return NextResponse.json({
      success: true,
      result: aiResult,
    });
  } catch (error) {
    console.error("AI processing error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error al procesar archivo con IA";

    // Check for rate limit / quota errors
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      return NextResponse.json(
        {
          error:
            "La cuota de la API de Gemini se ha agotado. Intenta de nuevo en unos segundos o verifica tu plan en aistudio.google.com",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Parse and validate AI response JSON
 */
function parseAIResponse(text: string) {
  // Remove markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);

    return {
      classification: parsed.classification === "personal" ? "personal" : "academica",
      course_name: parsed.course_name || null,
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks.map(
            (t: { title?: string; description?: string; due_date?: string; location?: string; event_type?: string; subtasks?: string[] }) => ({
              title: t.title || "Tarea sin título",
              description: t.description || "",
              due_date:
                t.due_date || new Date(Date.now() + 7 * 86400000).toISOString(),
              location: t.location || null,
              event_type: t.event_type || "recordatorio",
              subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
            })
          )
        : [],
      follow_up_questions: Array.isArray(parsed.follow_up_questions) ? parsed.follow_up_questions : [],
      follow_up_voice_message: parsed.follow_up_voice_message || null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
    };
  } catch {
    return {
      classification: "personal" as const,
      course_name: null,
      tasks: [
        {
          title: "Tarea extraída del archivo",
          description: text.substring(0, 200),
          due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
          location: null,
          event_type: "recordatorio",
          subtasks: [],
        },
      ],
      follow_up_questions: [],
      follow_up_voice_message: null,
      confidence: 0.3,
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveUploadRecord(supabase: any, userId: string, file: File, aiResult: any) {
  try {
    await supabase.from("file_uploads").insert({
      user_id: userId,
      file_name: file.name,
      file_type: file.type,
      storage_path: `${userId}/${Date.now()}_${file.name}`,
      ai_processed: true,
      ai_result: aiResult,
    });
  } catch (err) {
    console.error("Error saving upload record:", err);
  }
}
