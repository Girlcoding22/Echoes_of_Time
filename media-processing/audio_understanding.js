import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "node:fs";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

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
    // Create the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Create the prompt
    const prompt = "This is the audiotrack for someone's day. Please provide a description of this day.";
    
    // Generate content with the audio
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: audio_64,
          mimeType: "audio/mp3"
        }
      }
    ]);
    
    const response = await result.response;
    const text_response = response.text();
    
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