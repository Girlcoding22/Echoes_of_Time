import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { audio_processing, describe_audio } from './media-processing/audio_understanding.js';
import { describe_video } from './media-processing/video_understanding.js';
import { extractAudioFromMP4, extractAudioFromMP4Alternative } from './media-processing/audio-utils.js';
import { generate_song } from './song/song_generation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS for frontend
app.use(cors());

// Serve only specific static files that upload.html needs
app.use('/script.js', express.static('frontend/script.js'));
app.use('/style.css', express.static('frontend/style.css'));

// Serve generated songs
app.use('/generated-songs', express.static('generated-songs'));

// Route for upload.html (root and explicit)
app.get(['/', '/upload.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'upload.html'));
});

// Route for result page
app.get('/result', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'result.html'));
});

// Block access to all other frontend files
app.use('/frontend/*', (req, res) => {
    res.status(404).send('File not found');
});

// Block access to other HTML files
app.use('*.html', (req, res) => {
    if (req.path === '/upload.html') {
        res.sendFile(path.join(__dirname, 'frontend', 'upload.html'));
    } else {
        res.status(404).send('File not found');
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create uploads directory if it doesn't exist
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Processing status tracking
const processingStatus = new Map();

// Function to process uploaded file
async function processUploadedFile(filePath, filename) {
    try {
        // Set initial processing status
        processingStatus.set(filename, {
            status: 'processing',
            startTime: new Date(),
            progress: 'Starting...'
        });

        console.log(`\n🎯 PROCESSING UPLOADED FILE: ${filename}`);
        console.log(`📁 File path: ${filePath}`);
        
        const fileExtension = filename.split('.').pop().toLowerCase();
        
        if (fileExtension === 'mp3' || fileExtension === 'm4a' || fileExtension === 'wav') {
            processingStatus.set(filename, {
                status: 'processing',
                progress: 'Processing audio file...'
            });
            
            console.log('🎵 Audio file detected - processing with audio_processing...');
            const audio_description = await audio_processing(filePath);
            console.log('✅ Audio processing completed:', audio_description);
            
            processingStatus.set(filename, {
                status: 'completed',
                progress: 'Audio processing completed',
                result: { type: 'audio', description: audio_description },
                endTime: new Date()
            });
            
            // Delete the processed file
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted processed audio file: ${filename}`);
            
            return { type: 'audio', description: audio_description };
            
        } else if (fileExtension === 'mp4' || fileExtension === 'mov' || fileExtension === 'avi') {
            processingStatus.set(filename, {
                status: 'processing',
                progress: 'Extracting audio from video...'
            });
            
            console.log('🎬 Video file detected - extracting audio...');
            let audio_file64;
            try {
                audio_file64 = await extractAudioFromMP4(filePath);
            } catch (error) {
                console.log('Primary extraction failed, trying alternative...');
                audio_file64 = await extractAudioFromMP4Alternative(filePath);
            }
            
            processingStatus.set(filename, {
                status: 'processing',
                progress: 'Processing extracted audio...'
            });
            
            console.log('🎵 Audio extracted - processing with describe_audio...');
            const audio_description = await describe_audio(audio_file64);
            console.log('✅ Audio description completed:', audio_description);
            
            processingStatus.set(filename, {
                status: 'processing',
                progress: 'Analyzing video content...'
            });
            
            console.log('🎬 Video analysis - processing with describe_video...');
            const video_description = await describe_video(filePath);
            console.log('✅ Video description completed:', video_description);
            
            processingStatus.set(filename, {
                status: 'processing',
                progress: 'Generating song based on video content...'
            });
            
            console.log('🎵 Generating song based on video description...');
            const song_result = await generate_song(video_description, `song-${filename}`, 'generated-songs');
            console.log('✅ Song generation completed:', song_result.filename);
            
            processingStatus.set(filename, {
                status: 'completed',
                progress: 'Video processing and song generation completed',
                result: { 
                    type: 'video', 
                    audioDescription: audio_description,
                    videoDescription: video_description,
                    songFile: song_result.filename,
                    songPath: song_result.mp3Path,
                    combinedDescription: `AUDIO ANALYSIS:\n${audio_description}\n\nVIDEO ANALYSIS:\n${video_description}\n\nGENERATED SONG:\n${song_result.filename}`
                },
                endTime: new Date()
            });
            
            // Delete the processed file
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted processed video file: ${filename}`);
            
            return { 
                type: 'video', 
                audioDescription: audio_description,
                videoDescription: video_description,
                songFile: song_result.filename,
                songPath: song_result.mp3Path,
                combinedDescription: `AUDIO ANALYSIS:\n${audio_description}\n\nVIDEO ANALYSIS:\n${video_description}\n\nGENERATED SONG:\n${song_result.filename}`
            };
            
        } else {
            processingStatus.set(filename, {
                status: 'completed',
                progress: 'File type not supported',
                result: { type: 'other', description: 'File type not supported for processing' },
                endTime: new Date()
            });
            
            console.log('📄 Other file type - no processing available');
            
            // Delete unsupported files too
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted unsupported file: ${filename}`);
            
            return { type: 'other', description: 'File type not supported for processing' };
        }
        
    } catch (error) {
        console.error('❌ Error processing file:', error);
        
        processingStatus.set(filename, {
            status: 'error',
            progress: 'Processing failed',
            error: error.message,
            endTime: new Date()
        });
        
        // Try to delete the file even if processing failed
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Deleted file after processing error: ${filename}`);
            }
        } catch (deleteError) {
            console.error(`❌ Failed to delete file after error: ${filename}`, deleteError);
        }
        
        return { type: 'error', description: error.message };
    }
}

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        console.log('File uploaded:', req.file.originalname);
        console.log('Stored at:', req.file.path);

        // Send immediate response to client
        res.json({
            success: true,
            message: 'File uploaded successfully',
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            path: req.file.path
        });

        // Process the file asynchronously (don't wait for response)
        processUploadedFile(req.file.path, req.file.filename)
            .then(result => {
                console.log(`\n🎉 File processing completed for: ${req.file.filename}`);
                console.log(`📊 Processing result:`, result);
            })
            .catch(error => {
                console.error(`\n💥 File processing failed for: ${req.file.filename}`, error);
            });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during upload'
        });
    }
});

// Get processing status for a specific file
app.get('/api/processing-status/:filename', (req, res) => {
    const { filename } = req.params;
    const status = processingStatus.get(filename);
    
    if (status) {
        res.json({ success: true, status });
    } else {
        res.json({ success: false, message: 'File not found in processing queue' });
    }
});

// Get processing results for a specific file
app.get('/api/processing-results/:filename', (req, res) => {
    const { filename } = req.params;
    const status = processingStatus.get(filename);
    
    if (status && status.status === 'completed' && status.result) {
        res.json({ success: true, result: status.result });
    } else if (status && status.status === 'error') {
        res.json({ success: false, error: status.error || 'Processing failed' });
    } else if (status && status.status === 'processing') {
        res.json({ success: false, message: 'Processing still in progress', progress: status.progress });
    } else {
        res.json({ success: false, message: 'File not found or no results available' });
    }
});

// Get all processing statuses
app.get('/api/processing-status', (req, res) => {
    const allStatuses = Object.fromEntries(processingStatus);
    res.json({ success: true, statuses: allStatuses });
});

// Get list of uploaded files
app.get('/api/files', (req, res) => {
    try {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            return res.json({ files: [] });
        }

        const files = fs.readdirSync(uploadDir).map(filename => {
            const filePath = path.join(uploadDir, filename);
            const stats = fs.statSync(filePath);
            return {
                filename,
                size: stats.size,
                uploadDate: stats.mtime,
                path: filePath
            };
        });

        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get files' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Uploads will be stored in: ${path.join(process.cwd(), 'uploads')}`);
    console.log(`🎯 File processing will trigger automatically on upload!`);
}); 