import { NextResponse } from "next/server";
import textToSpeech from "@google-cloud/text-to-speech";

// El cliente tomará automáticamente las credenciales de process.env.GOOGLE_APPLICATION_CREDENTIALS
const ttsClient = new textToSpeech.TextToSpeechClient();

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const req = {
      input: { text },
      // Configuración de voz "Neural2" que es la más natural y humana de Google Cloud
      voice: { 
          languageCode: "es-ES", 
          name: "es-ES-Neural2-F" // Voz femenina hiperrealista
      },
      audioConfig: { 
          audioEncoding: "MP3" as const, 
          speakingRate: 1.05, // Ligeramente más rápido para ser conversacional
          pitch: 1.0
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(req);
    
    if (!response.audioContent) {
        throw new Error("No audio content returned from Google Cloud");
    }

    return new NextResponse(response.audioContent as Uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("Google Cloud TTS Error:", error);
    
    if (error.message?.includes("Could not load the default credentials")) {
        return NextResponse.json(
            { error: "Faltan las credenciales de Google Cloud (GOOGLE_APPLICATION_CREDENTIALS)" }, 
            { status: 500 }
        );
    }
    
    return NextResponse.json(
      { error: "Error interno procesando TTS con Google" },
      { status: 500 }
    );
  }
}
