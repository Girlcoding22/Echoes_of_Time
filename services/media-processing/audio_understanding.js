import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const LLM = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function audio_processing(audio_path) {
  const audio_64 = encode_audio(audio_path);
  return await describe_audio(audio_64);
}

function encode_audio(audio_path) {
  return fs.readFileSync(audio_path, {
    encoding: "base64",
  }); 
}

async function describe_audio(audio_64) {
  try {
    const contents = [
      { text: "This is the audiotrack for someone's day. Please provide a description of this day." },
      {
        inlineData: {
          mimeType: "audio/mp3",
          data: audio_64,
        },
      },
    ];
    
    const request = {
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

// Export the functions for use in other modules
export { audio_processing }; 
export { describe_audio }; 