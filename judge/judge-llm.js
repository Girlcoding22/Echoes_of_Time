import { GoogleGenAI } from "@google/genai";

const LLM = new GoogleGenAI({ apiKey: "GEMINI_API_KEY" });

const PROMPT = "In the following order you will be given a video description and an audio description of a same video. Your job is to first see if they are describing globally the same video. If yes, return only the word True. Else, return False."

async function judge (audio_description, video_description = "") {
  const response = await LLM.models.generateContent({
    model: "gemini-2.5-flash",
    contents: PROMPT,
  });
  console.log(response.text);
}

await main();