import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in parent directory
dotenv.config({ path: path.join(process.cwd(), '../..', '.env') });

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

// Test the judge functionality
async function main() {
  console.log('🎯 Testing Judge LLM...\n');
  
  const testCases = [
    {
      audio: "A young man with dark, curly hair is casually seated on a park bench, strumming a vintage acoustic guitar. He's wearing a faded denim jacket over a simple white t-shirt, his fingers dancing across the strings. The park is bathed in soft, golden sunlight, and the scene has a relaxed, carefree vibe. A few vibrant green trees frame the image, with a blurry background suggesting a busy park with a few unseen people. This photo showcases a moment of tranquil joy. The scene is a portrayal of everyday life, with the guitar player as the central focus of the image, and a sense of peace and calm, created by the soft light and the soft colors. The camera angle is at eye level with the player, giving a sense of intimacy.",
      video: "A young man with dark brown hair and a scruffy beard plays an acoustic guitar outdoors in a sunny park. He wears a faded denim jacket and dark jeans, a casual yet comfortable look for a relaxed afternoon of music. The guitar is a well-worn but well-loved instrument, with subtle signs of wear that enhance its character and suggest it's been played often. The scene is bathed in warm, natural light, with sunlight filtering through the leaves of surrounding trees and casting a dappled pattern on the ground. The trees are lush and green, and the grass below them is a vibrant emerald. The background is softly blurred, drawing the viewer's focus to the musician and his instrument. The image is evocative of a carefree moment, with a relaxed, candid feel captured by a street photography style.",
      expected: "True"
    },
    {
      audio: "A person playing guitar in a park", 
      video: "A car driving on the highway",
      expected: "False"
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`📋 Testing: "${testCase.audio}" vs "${testCase.video}"`);
      const result = await generateSongDescription(testCase.audio, testCase.video);
      console.log(`   Result: ${result}`);
      console.log(`   ${result}\n`);
    } catch (error) {
      console.error(`   ❌ ERROR: ${error.message}\n`);
    }
  }
}

main().catch(console.error);

export {generateSongDescription}; 

