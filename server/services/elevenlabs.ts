const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "sk_cbcfce5070fc7060055ac6c007db6435b73ccd68ab3282f6";
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

// Default voice ID - using the example voice from user's code
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Example public voice from user's code

export async function textToSpeech(text: string, voiceId: string = DEFAULT_VOICE_ID): Promise<ArrayBuffer> {
  try {
    console.log('Calling ElevenLabs API with text length:', text.length);
    
    const url = `${ELEVENLABS_API_URL}/${voiceId}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "audio/mpeg",
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('ElevenLabs audio generated successfully, size:', arrayBuffer.byteLength);
    return arrayBuffer;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
}

