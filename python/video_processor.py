import cv2
import os
import torch
from PIL import Image
from transformers import Blip2Processor, Blip2ForConditionalGeneration
import json
import numpy as np
import base64
from io import BytesIO

class VideoProcessor:
    def __init__(self):
        self.processor = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._load_model()
    
    def _load_model(self):
        """Load a vision model for image captioning"""
        try:
            from transformers import AutoProcessor, AutoModelForVision2Seq
            
            # Use a simpler, more compatible model
            model_name = "nlpconnect/vit-gpt2-image-captioning"
            self.processor = AutoProcessor.from_pretrained(model_name)
            self.model = AutoModelForVision2Seq.from_pretrained(model_name)
            self.model.to(self.device)
            print(f"Vision model loaded successfully on {self.device}")
        except Exception as e:
            print(f"Error loading vision model: {e}")
            self.processor = None
            self.model = None
    
    def extract_frames_and_describe(self, video_path, frame_interval=1.0, max_frames=30):
        """
        Extract frames from video and generate descriptions
        
        Args:
            video_path (str): Path to the video file
            frame_interval (float): Interval between frames in seconds
            max_frames (int): Maximum number of frames to process
            
        Returns:
            list: List of dictionaries with timestamp and description
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0:
            fps = 25  # Fallback FPS
        
        extracted_data = []
        current_second_target = 0.0
        
        print("Starting video frame extraction and analysis...")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            current_time_in_seconds = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
            
            if current_time_in_seconds >= current_second_target and len(extracted_data) < max_frames:
                # Generate description for this frame
                description = self._generate_frame_description(frame)
                
                # Format timestamp
                timestamp = self._format_timestamp(current_time_in_seconds)
                
                extracted_data.append({
                    "timestamp": timestamp,
                    "caption": description,
                    "ocr_text": []  # Placeholder for OCR text if needed
                })
                
                current_second_target += frame_interval
            
            if len(extracted_data) >= max_frames:
                break
        
        cap.release()
        cv2.destroyAllWindows()
        
        print(f"Processed {len(extracted_data)} frames")
        return extracted_data
    
    def _generate_frame_description(self, frame):
        """Generate description for a single frame"""
        if not self.processor or not self.model:
            return "Unable to generate description - model not loaded"
        
        try:
            # Convert BGR to RGB
            pil_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            
            # Generate description using the vision model
            inputs = self.processor(images=pil_image, return_tensors="pt").to(self.device)
            
            with torch.no_grad():
                generated_ids = self.model.generate(
                    pixel_values=inputs.pixel_values,
                    max_length=50,
                    num_beams=4,
                    early_stopping=True
                )
            
            description = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            return description.strip()
            
        except Exception as e:
            return f"Error generating description: {str(e)}"
    
    def _format_timestamp(self, seconds):
        """Format seconds into MM:SS.mmm format"""
        minutes = int(seconds // 60)
        seconds_remainder = seconds % 60
        return f"{minutes:02d}:{seconds_remainder:06.3f}" 