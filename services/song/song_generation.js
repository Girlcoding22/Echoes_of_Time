import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in project root
dotenv.config({ path: path.join(process.cwd(), '.env') });

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
        console.log('Generating song...');
        console.log('Prompt:', prompt);
        
        const song_json = await generateSong(prompt);
        
        if (!song_json.predictions || !song_json.predictions[0] || !song_json.predictions[0].audioContent) {
            throw new Error('No audio content found in the response');
        }
        
        const audio_base64 = song_json.predictions[0].audioContent;
        console.log("Base64:", audio_base64)
        const mp3Path = await writeMP3FromBase64(audio_base64, filename, outputDir);
        
        console.log('Song generation and file creation completed!');
        
        return {
            response: song_json,
            mp3Path: mp3Path,
            filename: path.basename(mp3Path)
        };
        
    } catch (error) {
        console.error('Error in generate_song:', error);
        throw error;
    }
}

/**
 * Generate a song using Google's Lyria model
 * @param {string} prompt - The music description prompt
 * @param {string} region - Google Cloud location (e.g., 'us-central1')
 * @returns {Promise<Object>} - The generated music response
 */
export async function generateSong(prompt, negative_prompt = "", seed = null, region = null) {
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
    const cloudRegion = region || process.env.GOOGLE_CLOUD_REGION || 'us-central1';
    
    if (!accessToken) {
        throw new Error('GOOGLE_ACCESS_TOKEN not found in environment variables');
    }

    const url = `https://${cloudRegion}-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/${cloudRegion}/publishers/google/models/lyria-002:predict`;

    const requestBody = {
        "instances": [
          {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "seed": seed
          }
        ],
        "parameters": {
          "sample_count": 1
        }
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }

        const data = await response.json();
        
        // Check for the actual response format
        if (data.predictions && data.predictions[0]) {
            const prediction = data.predictions[0];
            
            // Check for bytesBase64Encoded (the actual format)
            if (prediction.bytesBase64Encoded) {
                return {
                    success: true,
                    audioData: prediction.bytesBase64Encoded,
                    format: 'base64'
                };
            }
            
            // Check for audioContent (fallback)
            if (prediction.audioContent) {
                return {
                    success: true,
                    audioData: prediction.audioContent,
                    format: 'audioContent'
                };
            }
            
            // If neither format is found, return the full response for debugging
            console.log('Available keys in prediction:', Object.keys(prediction));
            return {
                success: false,
                error: 'No audio content found in the response',
                fullResponse: data
            };
        }
        
        return {
            success: false,
            error: 'No predictions found in response',
            fullResponse: data
        };
        
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

/**
 * Generate a song and save it as an MP3 file
 * @param {string} prompt - The music description prompt
 * @param {string} filename - Output filename (without extension)
 * @param {string} region - Google Cloud location (e.g., 'us-central1')
 * @returns {Promise<Object>} - Object containing the API response and file path
 */
export async function generateAndSaveSong(prompt, filename = null, region = 'us-central1') {
    try {
        console.log('🎵 Generating song with prompt:', prompt);
        
        const result = await generateSong(prompt, region);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to generate song');
        }
        
        // Generate filename if not provided
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            filename = `generated_song_${timestamp}.mp3`;
        }
        
        // Ensure the filename has .mp3 extension
        if (!filename.endsWith('.mp3')) {
            filename += '.mp3';
        }
        
        const filepath = path.join(__dirname, 'generated-songs', filename);
        
        // Write the audio data to file
        if (result.format === 'base64') {
            // Handle bytesBase64Encoded format
            const audioBuffer = Buffer.from(result.audioData, 'base64');
            fs.writeFileSync(filepath, audioBuffer);
        } else if (result.format === 'audioContent') {
            // Handle audioContent format (fallback)
            const audioBuffer = Buffer.from(result.audioData, 'base64');
            fs.writeFileSync(filepath, audioBuffer);
        } else {
            throw new Error(`Unknown audio format: ${result.format}`);
        }
        
        console.log('✅ Song saved successfully:', filepath);
        
        return {
            success: true,
            filepath: filepath,
            filename: filename
        };
        
    } catch (error) {
        console.error('❌ Error generating and saving song:', error);
        throw error;
    }
}

// Export functions for use in other modules
export { generate_song, writeMP3FromBase64 };

