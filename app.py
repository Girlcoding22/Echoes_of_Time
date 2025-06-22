from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import os
import tempfile
from werkzeug.utils import secure_filename
from video_processor import VideoProcessor
from llama_cpp import Llama
import json

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'}
MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Create upload directory
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize processors
video_processor = VideoProcessor()

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
        prompt = f"""
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
"""
        return prompt

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# HTML template for the web interface
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video to Text Converter</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
        .upload-area {
            border: 2px dashed #ddd;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            margin-bottom: 20px;
            transition: all 0.3s ease;
        }
        .upload-area:hover {
            border-color: #667eea;
            background-color: #f8f9ff;
        }
        .upload-area.dragover {
            border-color: #667eea;
            background-color: #f0f4ff;
        }
        input[type="file"] {
            display: none;
        }
        .upload-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        .upload-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .progress {
            display: none;
            margin: 20px 0;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background-color: #f0f0f0;
            border-radius: 10px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            width: 0%;
            transition: width 0.3s ease;
        }
        .result {
            margin-top: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        .error {
            background-color: #ffe6e6;
            border-left-color: #dc3545;
            color: #721c24;
        }
        .loading {
            text-align: center;
            color: #666;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎥 Video to Text Converter</h1>
        <p style="text-align: center; color: #666; margin-bottom: 30px;">
            Upload a 30-second video and get a detailed description of its content, environment, and ambiance.
        </p>
        
        <div class="upload-area" id="uploadArea">
            <p>📁 Drag and drop your video file here or click to browse</p>
            <input type="file" id="videoFile" accept=".mp4,.avi,.mov,.mkv,.wmv,.flv,.webm">
            <button class="upload-btn" onclick="document.getElementById('videoFile').click()">
                Choose Video File
            </button>
        </div>
        
        <div class="progress" id="progress">
            <p>Processing video... This may take a few minutes.</p>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
        </div>
        
        <div id="result"></div>
    </div>

    <script>
        const uploadArea = document.getElementById('uploadArea');
        const videoFile = document.getElementById('videoFile');
        const progress = document.getElementById('progress');
        const result = document.getElementById('result');
        
        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
        
        videoFile.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
        
        function handleFile(file) {
            if (!file.type.startsWith('video/')) {
                showError('Please select a valid video file.');
                return;
            }
            
            if (file.size > 100 * 1024 * 1024) { // 100MB
                showError('File size must be less than 100MB.');
                return;
            }
            
            uploadFile(file);
        }
        
        function uploadFile(file) {
            const formData = new FormData();
            formData.append('video', file);
            
            progress.style.display = 'block';
            result.innerHTML = '<div class="loading"><div class="spinner"></div><p>Processing your video...</p></div>';
            
            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                progress.style.display = 'none';
                if (data.success) {
                    showResult(data.description);
                } else {
                    showError(data.error || 'An error occurred while processing the video.');
                }
            })
            .catch(error => {
                progress.style.display = 'none';
                showError('Network error: ' + error.message);
            });
        }
        
        function showResult(description) {
            result.innerHTML = `
                <div class="result">
                    <h3>📝 Video Description</h3>
                    <p>${description.replace(/\\n/g, '<br>')}</p>
                </div>
            `;
        }
        
        function showError(message) {
            result.innerHTML = `
                <div class="result error">
                    <h3>❌ Error</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/upload', methods=['POST'])
def upload_video():
    try:
        if 'video' not in request.files:
            return jsonify({'success': False, 'error': 'No video file provided'})
        
        file = request.files['video']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Invalid file type. Please upload a video file.'})
        
        # Save the uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Process the video
            print(f"Processing video: {filepath}")
            frame_data = video_processor.extract_frames_and_describe(filepath)
            
            # Generate final description using Llama
            print("Generating final description with Llama...")
            llama_describer = LlamaVideoDescriber()
            final_description = llama_describer.generate_video_description(frame_data)
            
            # Clean up the uploaded file
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'description': final_description,
                'frame_count': len(frame_data)
            })
            
        except Exception as e:
            # Clean up on error
            if os.path.exists(filepath):
                os.remove(filepath)
            raise e
            
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error processing video: {str(e)}'
        })

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Video to Text service is running'})

if __name__ == '__main__':
    print("Starting Video to Text Converter...")
    print("Make sure to set your ANTHROPIC_API_KEY environment variable")
    app.run(debug=True, host='0.0.0.0', port=8080) 