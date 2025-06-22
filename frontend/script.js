// File upload functionality with alert-based monitoring
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const chooseFileBtn = document.getElementById('chooseFileBtn');
    const processBtn = document.getElementById('processBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileType = document.getElementById('fileType');

    // Check if all required elements exist
    if (!uploadArea || !fileInput || !chooseFileBtn || !processBtn || !fileInfo || !fileName || !fileSize || !fileType) {
        console.error('Required DOM elements not found');
        return;
    }

    let selectedFile = null;

    // Hide file info initially
    fileInfo.style.display = 'none';

    // Choose file button click
    chooseFileBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelection(file);
        }
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            handleFileSelection(file);
        }
    });

    // Handle file selection
    function handleFileSelection(file) {
        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            alert('File size must be less than 50MB.');
            return;
        }

        selectedFile = file;
        displayFileInfo(file);
        processBtn.disabled = false;
    }

    // Display file information
    function displayFileInfo(file) {
        fileName.textContent = file.name;
        fileSize.textContent = `Size: ${formatFileSize(file.size)}`;
        fileType.textContent = `Type: ${file.type}`;
        fileInfo.style.display = 'block';
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Process button click
    processBtn.addEventListener('click', () => {
        if (selectedFile) {
            uploadFile(selectedFile);
        }
    });

    // Upload file function
    async function uploadFile(file) {
        try {
            processBtn.disabled = true;
            processBtn.textContent = 'Processing...';

            // Create FormData
            const formData = new FormData();
            formData.append('file', file);

            // Use relative URL or get from window.location for flexibility
            const baseUrl = window.location.origin;
            const uploadUrl = `${baseUrl}/api/upload`;

            // Send file to server
            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Handle response
            if (result.success) {
                // Redirect immediately to result page with filename
                window.location.href = `/result?filename=${encodeURIComponent(result.filename)}`;
            } else {
                throw new Error(result.message || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload error:', error);
            alert('Error processing file: ' + error.message);
            
            // Reset UI on error
            processBtn.disabled = false;
            processBtn.textContent = 'Process File';
        }
    }
});

// //This script is for the loading screen functionality
// var myVar;

// function loadTimer() {
//   myVar = setTimeout(showPage, 3000);
// }

// function showPage() {
//   document.getElementById("Loader").style.display = "none";
//   document.getElementById("myDiv").style.display = "block";
// }