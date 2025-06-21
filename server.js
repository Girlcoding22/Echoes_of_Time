const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for frontend
app.use(cors());

// Serve only specific static files that upload.html needs
app.use('/script.js', express.static('frontend/script.js'));
app.use('/style.css', express.static('frontend/style.css'));

// Route for upload.html (root and explicit)
app.get(['/', '/upload.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'upload.html'));
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

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        console.log('File uploaded:', req.file.originalname);
        console.log('Stored at:', req.file.path);

        res.json({
            success: true,
            message: 'File uploaded successfully',
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            path: req.file.path
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during upload'
        });
    }
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
}); 