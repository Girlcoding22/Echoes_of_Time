import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

// Define types for better type safety
interface AudioContent {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GenerateContentRequest {
  model: string;
  contents: AudioContent[];
}

const LLM = new GoogleGenAI({ apiKey: "GOOGLE_API_KEY" });

/**
 * Returns the summary of an audio file interpreted by Gemini API
 * @param audio_path 
 * @returns 
 */
async function audio_processing(audio_path: string): Promise<string | void >{
  try {
    const base64AudioFile: string = fs.readFileSync(audio_path, {
      encoding: "base64",
    });
    
    const contents: AudioContent[] = [
      { text: "This is the audiotrack for someone's day. Please provide a description of this day." },
      {
        inlineData: {
          mimeType: "audio/mp3",
          data: base64AudioFile,
        },
      },
    ];
    
    const request: GenerateContentRequest = {
      model: "gemini-2.5-flash",
      contents: contents,
    };
    
    const response = await LLM.models.generateContent(request);
    
    const text_response = response.text;
    // Handle the response
    console.log("Audio processing response:", text_response);
    return text_response;
    
  } catch (error) {
    console.error("Error processing audio:", error);
    throw error;
  }
}

// Export the function for use in other modules
export { audio_processing }; 