import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Function to extract audio from MP4 and return as base64
export async function extractAudioFromMP4(mp4Path) {
    try {
        console.log(`🎵 Extracting audio from: ${path.basename(mp4Path)}`);
        
        // Generate output path for audio file
        const outputDir = path.dirname(mp4Path);
        const baseName = path.basename(mp4Path, path.extname(mp4Path));
        const audioPath = path.join(outputDir, `${baseName}_audio.mp3`);
        
        // Use ffmpeg to extract audio (requires ffmpeg to be installed)
        const ffmpegCommand = `ffmpeg -i "${mp4Path}" -vn -acodec mp3 -ab 128k -ar 44100 -y "${audioPath}"`;
        
        console.log('   🔧 Running ffmpeg command...');
        await execAsync(ffmpegCommand);
        
        // Read the extracted audio file as base64
        console.log('   📖 Reading audio file as base64...');
        const audioBuffer = fs.readFileSync(audioPath);
        const base64Audio = audioBuffer.toString('base64');
        
        // Clean up the temporary audio file
        fs.unlinkSync(audioPath);
        console.log('   🧹 Cleaned up temporary audio file');
        
        console.log(`   ✅ Audio extraction complete! Base64 length: ${base64Audio.length} characters`);
        return base64Audio;
        
    } catch (error) {
        console.error('   ❌ Error extracting audio:', error.message);
        
        // Check if ffmpeg is not installed
        if (error.message.includes('ffmpeg: command not found')) {
            console.error('   💡 Please install ffmpeg: brew install ffmpeg (macOS) or apt-get install ffmpeg (Ubuntu)');
        }
        
        throw error;
    }
}

// Alternative function using a different approach (if ffmpeg is not available)
export async function extractAudioFromMP4Alternative(mp4Path) {
    try {
        console.log(`Extracting audio (alternative method) from: ${path.basename(mp4Path)}`);
        
        // For this example, we'll just read the MP4 file as base64
        // In a real implementation, you'd use a Node.js video processing library
        const videoBuffer = fs.readFileSync(mp4Path);
        const base64Video = videoBuffer.toString('base64');
        
        console.log(`Note: This is the full video as base64, not just audio`);
        console.log(`Base64 length: ${base64Video.length} characters`);
        
        return base64Video;
        
    } catch (error) {
        console.error('Error in alternative audio extraction:', error.message);
        throw error;
    }
} 