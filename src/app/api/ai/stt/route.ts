import { NextResponse } from "next/server";
import { SpeechClient } from "@google-cloud/speech";

// El cliente tomará automáticamente las credenciales si están en process.env.GOOGLE_APPLICATION_CREDENTIALS
// que debe apuntar al archivo JSON de cuenta de servicio de Google Cloud.
const speechClient = new SpeechClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const audioBytes = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBytes).toString("base64");

    const requestConfig = {
      audio: {
        content: audioBase64,
      },
      config: {
        // Asume grabación en webm desde el navegador, ajustar si es distinto
        encoding: "WEBM_OPUS" as const, 
        sampleRateHertz: 48000,
        languageCode: "es-ES",
        enableAutomaticPunctuation: true, // Para resultados más "humanos"
        model: "latest_long",
      },
    };

    const [response] = await speechClient.recognize(requestConfig);
    const transcription = response.results
      ?.map((result) => result.alternatives?.[0].transcript)
      .join("\n");

    return NextResponse.json({ transcription, success: true });
  } catch (error: any) {
    console.error("Google Cloud STT error:", error);
    
    if (error.message.includes("Could not load the default credentials")) {
        return NextResponse.json({ error: "Faltan las credenciales de Google Cloud (GOOGLE_APPLICATION_CREDENTIALS)" }, { status: 500 });
    }

    return NextResponse.json({ error: "Error procesando audio con Google Cloud" }, { status: 500 });
  }
}
