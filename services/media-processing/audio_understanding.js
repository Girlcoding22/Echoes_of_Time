import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "node:fs";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const LLM = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

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
    const model = LLM.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const contents = [
      { text: "This is the audiotrack for someone's day. Please provide a description of this day." },
      {
        inlineData: {
          mimeType: "audio/mp3",
          data: audio_64,
        },
      },
    ];
    
    const response = await model.generateContent(contents);
    const text_response = response.response.text();
    
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