# Echoes of Time

A creative, AI powered web application that transform personal videos into unique, custom-generated songs. Thanks to Google Gemini and Lyria, we are able to generate a 30 second song based of the video and audio file the user sent.

## Features

- 🎥 **Video Upload**: Support for MP4 Format
- 🤖 **AI Description**: Generates detailed descriptions using Google Gemini
- 🌐 **Web Interface**: Beautiful, responsive web UI with drag-and-drop functionality
- ⚡ **Real-time Processing**: Live progress updates during video processing

## How It Works

1. **Video Upload**: Users upload a video file through the web interface
2. **Frame Extraction**: The system extracts frames at 1-second intervals (up to 30 frames for a 30-second video)
3. **Vision Analysis**: Each frame is analyzed using Google Gemini to analyze the text from video-to-text to see the theme/mood the song should generate.
4. **AI Synthesis**: Song generation service analysis the information received and creates a song from scratch.
5. **Result Display**: The User is then presented with the generated song along with a quick reasoning of why the song was generated like so. Giving the user the option to do it once again.

## Usage

### Running the Application

1. **Start the server**:

   ```bash
   npm start
   ```
2. **Open your browser**:
   Navigate to `http://localhost:3000`
3. **Upload a video**:

   - Drag and drop a video file or click to browse
   - Supported format: MP4
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

## Configuration

### Pre-Reqs

* Node.js: 18.x or later
* Set your API Keys for Gemini in environment
* Enable VertexAI API and create Google Cloud Project ID (see .env template to follow variable signatures)
* Git: for cloning the repository

### Environment Variables

- GOOGLE_API_KEY: Your Google API key (required) and all it's other Google API features.Technical Details
- GOOGLE_ACCESS_TOKEN: Your google authentication token.
- GOOGLE_CLOUD_PROJECT: where VertexAI and Lyria are enabled
- NODE_ENV
- PORT

### Architecture

- **Frontend**: HTML/CSS/JavaScript with drag-and-drop interface
- **Node.JS Backend:** The main server that handles the user requests, file management and orchestrates the AI pipeline

### Models Used

- **Google Gemini 2.5-flash:** Used for AI powered adjudicaton and Video & Audio analysis
- **Lyria-002:** Music Generation from text
