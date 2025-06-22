import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Song Generation using Google's Lyria Model
 * This function generates music using Google's AI Platform
 */

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
export { generateSong};

