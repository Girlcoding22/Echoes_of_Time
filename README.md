# Video to Text Converter

A powerful web application that converts 30-second videos into detailed text descriptions using AI. The system analyzes video frames using BLIP-2 vision model and generates comprehensive descriptions using Claude API.

## Features

- 🎥 **Video Upload**: Support for multiple video formats (MP4, AVI, MOV, MKV, WMV, FLV, WEBM)
- 🖼️ **Frame Analysis**: Extracts and analyzes frames at regular intervals using BLIP-2
- 🤖 **AI Description**: Generates detailed descriptions using Claude API
- 🌐 **Web Interface**: Beautiful, responsive web UI with drag-and-drop functionality
- ⚡ **Real-time Processing**: Live progress updates during video processing

## How It Works

1. **Video Upload**: Users upload a video file through the web interface
2. **Frame Extraction**: The system extracts frames at 1-second intervals (up to 30 frames for a 30-second video)
3. **Vision Analysis**: Each frame is analyzed using BLIP-2 to generate detailed captions
4. **AI Synthesis**: Claude API synthesizes all frame descriptions into a coherent narrative
5. **Result Display**: The final description is presented to the user

## Installation

### Prerequisites

- Python 3.8 or higher
- CUDA-compatible GPU (optional, for faster processing)
- Anthropic API key

### Setup

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd video-to-text
   ```

2. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:

   ```bash
   cp env_example.txt .env
   ```

   Edit `.env` and add your Anthropic API key:

   ```
   ANTHROPIC_API_KEY=your_actual_api_key_here
   ```

4. **Get your Anthropic API key**:
   - Visit [Anthropic Console](https://console.anthropic.com/)
   - Create an account and generate an API key
   - Add the key to your `.env` file

## Usage

### Running the Application

1. **Start the server**:

   ```bash
   python app.py
   ```

2. **Open your browser**:
   Navigate to `http://localhost:5000`

3. **Upload a video**:

   - Drag and drop a video file or click to browse
   - Supported formats: MP4, AVI, MOV, MKV, WMV, FLV, WEBM
   - Maximum file size: 100MB

4. **Wait for processing**:

   - The system will extract frames and analyze them
   - Processing time depends on video length and system performance

5. **View results**:
   - The final description will appear below the upload area
   - Descriptions focus on visual elements, environment, and ambiance

### Example Output

For a video showing a dog playing in a park:

```
The video opens with a serene outdoor scene featuring a lush green field under a clear blue sky. A small dog enters the frame and begins running across the field, chasing a red ball. The playful interaction continues as the dog picks up the ball in its mouth, and soon a person wearing a blue shirt approaches. The dog drops the ball at the person's feet, who then bends down to retrieve it and throws it into the distance, initiating a game of fetch.

As the game progresses, the camera reveals additional elements of the park setting - a large tree in the background, a small pond on the left side of the field, and a park bench in the far distance with the text "Enjoy Nature" visible on it. The sky remains clear with occasional white clouds, and bright sunlight illuminates the scene. The person and dog continue their playful interaction, with the dog jumping excitedly and the person throwing the ball multiple times. The video concludes with the dog retrieving the ball one final time and then lying down contentedly next to the person, suggesting the end of their play session.
```

## API Endpoints

- `GET /`: Main web interface
- `POST /upload`: Upload and process video file
- `GET /health`: Health check endpoint

## Configuration

### Environment Variables

- `ANTHROPIC_API_KEY`: Your Anthropic API key (required)

### Processing Parameters

You can modify these parameters in `video_processor.py`:

- `frame_interval`: Time between extracted frames (default: 1.0 seconds)
- `max_frames`: Maximum number of frames to process (default: 30)

## Technical Details

### Architecture

- **Frontend**: HTML/CSS/JavaScript with drag-and-drop interface
- **Backend**: Flask web server
- **Video Processing**: OpenCV for frame extraction
- **Vision Model**: BLIP-2 for frame analysis
- **Text Generation**: Claude API for final description synthesis

### Models Used

- **BLIP-2**: Salesforce's vision-language model for detailed image understanding
- **Claude 3 Sonnet**: Anthropic's language model for narrative synthesis

## Troubleshooting

### Common Issues

1. **"Model not loaded" error**:

   - Ensure you have sufficient RAM (8GB+ recommended)
   - Check if CUDA is available for GPU acceleration
   - Try running on CPU if GPU memory is insufficient

2. **API key errors**:

   - Verify your Anthropic API key is correct
   - Ensure the `.env` file is in the project root
   - Check that the key has sufficient credits

3. **Video processing errors**:
   - Ensure the video file is not corrupted
   - Check that the video format is supported
   - Verify the file size is under 100MB

### Performance Tips

- Use a GPU for faster BLIP-2 processing
- Reduce `max_frames` for shorter processing times
- Increase `frame_interval` for less detailed but faster analysis

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the repository.
