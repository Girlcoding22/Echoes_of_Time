import cv2
import os
import torch
from PIL import Image
from transformers import Blip2Processor, Blip2ForConditionalGeneration
import json
import numpy as np

# --- Configuration ---
input_video_path = "user_uploaded_video.mp4" # Placeholder: Cursor AI will replace this
output_frames_dir = "temp_vibe_frames"
frame_interval_seconds = 1.0 # Extract a frame every 1 second
max_frames_to_process = 30 # Limit for a 30-second video

# --- Setup Directories ---
print(f"Creating directory: {output_frames_dir}")
os.makedirs(output_frames_dir, exist_ok=True)
print("Directory created successfully.")

# --- Initialize Vision-Language Model (VLM) ---
# BLIP-2 is excellent for detailed image understanding. We'll prompt it for vibe.
try:
    processor = Blip2Processor.from_pretrained("Salesforce/blip2-opt")
    model = Blip2ForConditionalGeneration.from_pretrained("Salesforce/blip2-opt", torch_dtype=torch.float16)
    # Move model to GPU if available
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)
    print(f"BLIP-2 model loaded successfully on {device}.")
except Exception as e:
    print(f"Error loading BLIP-2 model: {e}. Please ensure libraries and device setup are correct.")
    processor, model = None, None # Set to None if loading fails

# --- Video Processing ---
cap = cv2.VideoCapture(input_video_path)
if not cap.isOpened():
    print(f"Error: Could not open video file {input_video_path}")
    exit()

fps = cap.get(cv2.CAP_PROP_FPS)
if fps == 0:
    print("Error: Could not get FPS from video. Assuming 25 FPS for time calculation.")
    fps = 25 # Fallback FPS

frame_idx = 0
current_second_target = 0.0
extracted_vibe_data = []

print("Starting video frame extraction and vibe analysis...")
while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Calculate current time in seconds based on frame position
    current_time_in_seconds = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0

    # Extract frame at specified interval and within max_frames limit
    if current_time_in_seconds >= current_second_target and len(extracted_vibe_data) < max_frames_to_process:
        frame_filename = os.path.join(output_frames_dir, f"vibe_frame_{int(current_second_target):04d}.jpg")
        cv2.imwrite(frame_filename, frame)

        vibe_description = "Could not assess vibe."

        # --- Vibe Assessment using VLM ---
        if processor and model:
            try:
                pil_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                
                # Prompt the VLM to focus on ambiance and vibe
                # Example 1: Direct question
                prompt_question = "What is the overall mood and atmosphere of this scene? Describe the lighting and color palette."
                inputs = processor(pil_image, text=prompt_question, return_tensors="pt").to(device, torch.float16)
                out = model.generate(**inputs)
                vibe_description_question = processor.decode(out[0], skip_special_tokens=True).strip()

                # Example 2: General caption focused on aesthetics
                # inputs_general = processor(pil_image, return_tensors="pt").to(device, torch.float16)
                # out_general = model.generate(**inputs_general)
                # general_caption = processor.decode(out_general[0], skip_special_tokens=True).strip()

                vibe_description = vibe_description_question
                # You could combine these, e.g., f"General: {general_caption}. Mood: {vibe_description_question}"

            except Exception as e:
                vibe_description = f"Error generating vibe description: {e}"
                print(vibe_description)
        else:
            vibe_description = "VLM not loaded or failed."
        
        extracted_vibe_data.append({
            "timestamp": f"{int(current_time_in_seconds // 60):02d}:{int(current_time_in_seconds % 60):02d}.{int((current_time_in_seconds - int(current_time_in_seconds)) * 1000):03d}",
            "vibe_description": vibe_description
        })
        current_second_target += frame_interval_seconds
        frame_idx += 1

    # Break if we've processed enough frames or reached end of video
    if len(extracted_vibe_data) >= max_frames_to_process:
        break

cap.release()
cv2.destroyAllWindows()
print("Video processing complete.")

# --- Output JSON to Cursor AI ---
# This JSON output will be passed to the next LLM step.
print("---START_JSON_OUTPUT---")
print(json.dumps(extracted_vibe_data, indent=2))
print("---END_JSON_OUTPUT---")

# --- Cleanup (optional, depending on Cursor AI environment and requirements) ---
# import shutil
# if os.path.exists(output_frames_dir):
#     shutil.rmtree(output_frames_dir)
#     print(f"Cleaned up temporary directory: {output_frames_dir}")