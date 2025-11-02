const SONIC_API_KEY = process.env.SONIC_API_KEY || "";
const SONIC_API_URL = "https://api.cartesia.ai/tts/bytes";

// Indian voice ID from user's example
const INDIAN_VOICE_ID = "9cebb910-d4b7-4a4a-85a4-12c79137724c";

export async function textToSpeechIndian(text: string): Promise<ArrayBuffer> {
  try {
    if (!SONIC_API_KEY) {
      throw new Error("SONIC_API_KEY is not configured");
    }

    console.log('Calling Sonic API (Cartesia) for Indian voice with text length:', text.length);
    
    const response = await fetch(SONIC_API_URL, {
      method: "POST",
      headers: {
        "Cartesia-Version": "2024-06-10",
        "X-API-Key": SONIC_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_id: "sonic-3",
        transcript: text,
        voice: {
          mode: "id",
          id: INDIAN_VOICE_ID
        },
        output_format: {
          container: "wav",
          encoding: "pcm_f32le",
          sample_rate: 44100
        },
        language: "en",
        speed: "normal",
        generation_config: {
          speed: 1,
          volume: 1
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sonic API error:", response.status, errorText);
      throw new Error(`Sonic API error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('Sonic audio generated successfully, size:', arrayBuffer.byteLength);
    return arrayBuffer;
  } catch (error) {
    console.error("Error generating speech with Sonic:", error);
    throw error;
  }
}

