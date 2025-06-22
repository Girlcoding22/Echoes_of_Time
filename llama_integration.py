import json
from llama_cpp import Llama

class LlamaVideoDescriber:
    def __init__(self, model_path="llama-3-8b-instruct.Q4_K_M.gguf"):
        self.llm = Llama(model_path=model_path, n_ctx=4096, n_threads=8)

    def generate_video_description(self, frame_data):
        if not frame_data:
            return "No video data provided for analysis."
        prompt = self._create_analysis_prompt(frame_data)
        output = self.llm(
            prompt,
            max_tokens=512,
            stop=["</s>", "User:"]
        )
        return output["choices"][0]["text"].strip()

    def _create_analysis_prompt(self, frame_data):
        frame_data_json = json.dumps(frame_data, indent=2)
        prompt = f'''
You are an advanced AI assistant specializing in describing video content *solely* based on visual information. Your task is to analyze a sequence of visual descriptions extracted from a video's frames and synthesize them into a coherent, descriptive narrative.

The video is approximately 30 seconds long. It may or may not contain significant actions or speech. Your description should focus on the progression of visual elements, objects, actions, and any on-screen text.

**Instructions:**
1. **Read Carefully:** Analyze the provided JSON data, which contains timestamps, generated image captions, and any detected on-screen text for each sampled frame.
2. **Synthesize and Summarize:** Combine related information across frames to form a continuous, flowing description. Avoid simply listing the captions.
3. **Focus on Visuals:** Describe what is *seen* in the video. Do not infer audio content or make assumptions beyond what the visual data suggests.
4. **Identify Key Events/Changes:** Highlight significant changes in the scene, appearance of new objects, or progression of actions.
5. **Maintain Chronological Order:** Ensure the description follows the video's timeline.
6. **Address On-Screen Text:** If `ocr_text` is present for any frame, incorporate it naturally into the description where relevant.
7. **Conciseness:** Aim for a comprehensive yet concise description suitable for a 30-second video. Approximately 3-5 sentences for a simple video, or slightly more for complex ones, is a good target.
8. **Handle Static Content:** If the video is mostly static, describe the primary visual elements present throughout.

**Here is the visual data extracted from the video:**

```json
{frame_data_json}
```

Please provide a comprehensive description of the video based on this visual data.
'''
        return prompt 