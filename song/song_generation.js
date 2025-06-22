import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file in parent directory
dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

/**
 * Song Generation using Google's Lyria Model
 * This function generates music using Google's AI Platform
 */

/**
 * Write base64 audio data to an MP3 file
 * @param {string} base64Audio - Base64 encoded audio data
 * @param {string} filename - Output filename (without extension)
 * @param {string} outputDir - Output directory (default: 'generated-songs')
 * @returns {Promise<string>} - Path to the generated MP3 file
 */
async function writeMP3FromBase64(base64Audio, filename = 'generated-song', outputDir = 'generated-songs') {
    try {
        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const mp3Filename = `${filename}-${timestamp}.mp3`;
        const mp3Path = path.join(outputDir, mp3Filename);

        // Convert base64 to buffer and write to file
        const audioBuffer = Buffer.from(base64Audio, 'base64');
        fs.writeFileSync(mp3Path, audioBuffer);

        console.log(`✅ MP3 file created: ${mp3Path}`);
        console.log(`📁 File size: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);

        return mp3Path;
    } catch (error) {
        console.error('❌ Error writing MP3 file:', error);
        throw error;
    }
}

/**
 * Generate a song and save it as an MP3 file
 * @param {string} prompt - The music description prompt
 * @param {string} filename - Output filename (without extension)
 * @param {string} outputDir - Output directory
 * @returns {Promise<Object>} - Object containing the API response and file path
 */
async function generate_song(prompt, filename = 'generated-song', outputDir = 'generated-songs') {
    try {
        console.log('🎵 Generating song...');
        console.log('📝 Prompt:', prompt);
        
        const song_json = await generateSong(prompt);
        
        if (!song_json.predictions || !song_json.predictions[0] || !song_json.predictions[0].audioContent) {
            throw new Error('No audio content found in the response');
        }
        
        const audio_base64 = song_json.predictions[0].audioContent;
        const mp3Path = await writeMP3FromBase64(audio_base64, filename, outputDir);
        
        console.log('🎉 Song generation and file creation completed!');
        
        return {
            response: song_json,
            mp3Path: mp3Path,
            filename: path.basename(mp3Path)
        };
        
    } catch (error) {
        console.error('❌ Error in generate_song:', error);
        throw error;
    }
}

/**
 * Generate a song using Google's Lyria model
 * @param {string} prompt - The music description prompt
 * @param {string} negativePrompt - What to avoid in the music
 * @param {number} seed - Random seed for reproducible results
 * @param {string} projectId - Google Cloud Project ID
 * @param {string} location - Google Cloud location (e.g., 'us-central1')
 * @returns {Promise<Object>} - The generated music response
 */
async function generateSong(prompt, negativePrompt = "", seed = null, projectId = null, location = "us-central1") {
    try {
        const accessToken = await getAccessToken();
        const finalProjectId = projectId || process.env.GOOGLE_CLOUD_PROJECT_ID;
        
        if (!finalProjectId) {
            throw new Error('Project ID is required. Set GOOGLE_CLOUD_PROJECT_ID in .env file or pass as parameter.');
        }
        
        const payload = {
            instances: [
                {
                    prompt: prompt,
                    negative_prompt: negativePrompt,
                    ...(seed && { seed: seed })
                }
            ],
            parameters: {}
        };

        const response = await fetch(
            `https://${location}-aiplatform.googleapis.com/v1/projects/${finalProjectId}/locations/${location}/publishers/google/models/lyria-002:predict`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Error generating song:', error);
        throw error;
    }
}

/**
 * Get Google Cloud access token
 * @returns {Promise<string>} - The access token
 */
async function getAccessToken() {
    // Priority 1: Environment variable
    if (process.env.GOOGLE_CLOUD_ACCESS_TOKEN) {
        return process.env.GOOGLE_CLOUD_ACCESS_TOKEN;
    }
    
    // Priority 2: gcloud CLI
    try {
        const { exec } = await import('child_process');
        const util = await import('util');
        const execAsync = util.promisify(exec);
        
        const { stdout } = await execAsync('gcloud auth print-access-token');
        return stdout.trim();
    } catch (error) {
        // Priority 3: Service account key file
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            const { GoogleAuth } = await import('google-auth-library');
            const auth = new GoogleAuth({
                keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
                scopes: ['https://www.googleapis.com/auth/cloud-platform']
            });
            const client = await auth.getClient();
            const token = await client.getAccessToken();
            return token.token;
        }
        
        throw new Error('No authentication method available. Set GOOGLE_CLOUD_ACCESS_TOKEN in .env file or install gcloud CLI.');
    }
}

// Export functions for use in other modules
export { generateSong, generate_song, writeMP3FromBase64 };

