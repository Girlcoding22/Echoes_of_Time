import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function describe_video(video_path) {
    try {
        console.log(`🎬 Processing video: ${video_path}`);
        
        // Read the video file as base64
        const videoBuffer = fs.readFileSync(video_path);
        const base64Video = videoBuffer.toString('base64');
        
        // Create the model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        // Create the prompt
        const prompt = "This is a video that someone has taken to illustrate their day. Please describe this video in detail keeping this in mind.";
        
        // Generate content with the video
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Video,
                    mimeType: "video/mp4"
                }
            }
        ]);
        
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ Video description completed`);
        return text;
        
    } catch (error) {
        console.error('❌ Error describing video:', error);
        throw error;
    }
}