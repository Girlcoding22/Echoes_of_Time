import {audio_processing} from './audio/audio_understanding.js';
import {describe_audio} from './audio/audio_understanding.js'
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

const uploadsDir = 'uploads';

console.log('Monitoring uploads directory...');
console.log('Press Ctrl+C to stop monitoring\n');

// Function to extract audio from MP4 and return as base64
async function extractAudioFromMP4(mp4Path) {
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
async function extractAudioFromMP4Alternative(mp4Path) {
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

// Initial file count
let initialFiles = fs.readdirSync(uploadsDir).length;
console.log(`📊 Initial files: ${initialFiles}`);

// Watch for changes
fs.watch(uploadsDir, async (eventType, filename) => {
    if (filename) {
        const currentFiles = fs.readdirSync(uploadsDir).length;
        const filePath = path.join(uploadsDir, filename);
        
        if (eventType === 'rename' && fs.existsSync(filePath)) {
            // New file added
            const stats = fs.statSync(filePath);
            const fileSizeKB = (stats.size / 1024).toFixed(2);
            
            console.log(`✅ NEW FILE UPLOADED:`);
            console.log(`Name: ${filename}`);
            console.log(`Size: ${fileSizeKB} KB`);
            console.log(`Time: ${new Date().toLocaleTimeString()}`);
            console.log(`Total files: ${currentFiles}\n`);
            
            // Activate the processing function
            try {
                if (filename.endsWith('.mp3')){
                    let audio_description = await audio_processing(filePath);
                    console.log('Audio processing completed:', audio_description);
                } else if (filename.endsWith('.mp4')) {
                    let audio_file64;
                    try {
                        audio_file64 = await extractAudioFromMP4(filePath);
                    } catch (error){
                        console.log('Primary extraction failed, trying alternative...');
                        audio_file64 = await extractAudioFromMP4Alternative(filePath);
                    }
                    let audio_description = await describe_audio(audio_file64);
                    console.log('Audio description completed:', audio_description);
                    // let video_description = describe_video()
                } else {
                    console.log("File is not a valid file");
                }
                // let song_description = describe_song(audio_description, video_description)
                // let song_generated = generate_song(song_description)
            } catch (error) {
                console.error('Error processing file:', error);
            }
            
        } else if (eventType === 'rename' && !fs.existsSync(filePath)) {
            // File removed
            console.log(`FILE REMOVED: ${filename}\n`);
        }
    }
});

console.log('Monitoring active - upload a file to see it here!'); 

// Export for use in other modules
export { 
    extractAudioFromMP4,
    extractAudioFromMP4Alternative
};