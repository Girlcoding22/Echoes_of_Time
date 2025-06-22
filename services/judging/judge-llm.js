import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in project root
dotenv.config({ path: path.join(process.cwd(), '.env') });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const JUDGE_PROMPT = `You are a judge that compares audio and video descriptions of the same content. 
Your task is to determine if the audio and video descriptions are describing the same content.

Rules:
1. If the descriptions match or are describing the same content, return "True"
2. If the descriptions are different or describing different content, return "False"
3. Only return "True" or "False" - no other text

Audio description: {audio_description}
Video description: {video_description}

Answer:`;

/**
 * Judge if audio and video descriptions match
 * @param {string} audioDescription - Description of the audio content
 * @param {string} videoDescription - Description of the video content
 * @returns {Promise<string>} - "True" if descriptions match, "False" if they don't
 */
export async function judgeDescriptions(audioDescription, videoDescription) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = JUDGE_PROMPT
      .replace('{audio_description}', audioDescription)
      .replace('{video_description}', videoDescription);
    
    const response = await model.generateContent(prompt);
    const result = await response.response;
    return result.text().trim();
  } catch (error) {
    console.error('Error in judgeDescriptions:', error);
    throw error;
  }
}

/**
 * Summarize audio and video descriptions
 * @param {string} audioDescription - Description of the audio content
 * @param {string} videoDescription - Description of the video content
 * @param {string} similarity - Whether descriptions match ("True" or "False")
 * @returns {Promise<string>} - Summary of the content
 */
export async function summarize(audioDescription, videoDescription = "", similarity = 'True') {
  let prompt;
  
  if (similarity === 'True') {
    prompt = `From these descriptions, summarize the video in a single sentence:\n\nAudio: ${audioDescription}\n\nVideo: ${videoDescription}`;
  } else if (similarity === 'False') {
    prompt = `From this description, summarize the video in a single sentence:\n\nVideo: ${videoDescription}`;
  } else {
    throw new Error("Invalid similarity value");
  }
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const response = await model.generateContent(prompt);
  const result = response.response;
  return result.text();
}

/**
 * Generate a song description based on video and audio descriptions
 * @param {string} videoDescription - Description of the video content
 * @param {string} audioDescription - Description of the audio content
 * @returns {Promise<string>} - Creative song description
 */
export async function generateSongDescription(videoDescription, audioDescription) {
  const similarity = await judgeDescriptions(audioDescription, videoDescription);
  const description = await summarize(audioDescription, videoDescription, similarity);
  
  const prompt = `Generate a song description based on the following description. Be creative and keep it short:\n\n${description}. Only provide one option.`;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const response = await model.generateContent(prompt);
  const result = await response.response;
  return result.text();
}

