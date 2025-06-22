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
            // Show upload starting alert
            alert('Starting file upload...');
            
            processBtn.disabled = true;
            processBtn.textContent = 'Processing...';

            // Create FormData
            const formData = new FormData();
            formData.append('file', file);

            // Send file to server
            const response = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Show upload completion alert
            alert(`File uploaded successfully!\nStored as: ${result.filename}\n\nProcessing will now begin automatically.`);
            
            // Handle response
            if (result.success) {
                // Start monitoring processing status
                monitorProcessingStatus(result.filename);
                
            } else {
                throw new Error(result.message || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload error:', error);
            alert('Error processing file: ' + error.message);
        } finally {
            // Reset UI
            processBtn.disabled = false;
            processBtn.textContent = 'Process File';
        }
    }

    // Monitor processing status
    function monitorProcessingStatus(filename) {
        console.log(`🔍 Starting to monitor processing for: ${filename}`);
        
        // Show processing started alert
        alert(`Processing started for: ${filename}\n\nYou will be notified when processing is complete.`);
        
        // Poll for status updates
        const statusInterval = setInterval(async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/processing-status/${filename}`);
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.success && data.status) {
                        // Show status update alert
                        if (data.status.status === 'processing') {
                            console.log(`Processing: ${data.status.progress}`);
                        } else if (data.status.status === 'completed') {
                            clearInterval(statusInterval);
                            console.log(`✅ Processing finished for: ${filename}`);
                            
                            // Show completion alert with results
                            let resultMessage = `Processing completed for: ${filename}\n\n`;
                            if (data.status.result) {
                                resultMessage += `Type: ${data.status.result.type}\n\n`;
                                resultMessage += `Description:\n${data.status.result.description}`;
                            } else {
                                resultMessage += `Status: ${data.status.progress}`;
                            }
                            alert(resultMessage);
                            
                        } else if (data.status.status === 'error') {
                            clearInterval(statusInterval);
                            console.log(`❌ Processing failed for: ${filename}`);
                            
                            // Show error alert
                            alert(`Processing failed for: ${filename}\n\nError: ${data.status.error || 'Unknown error'}`);
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking processing status:', error);
            }
        }, 2000); // Check every 2 seconds
    }
}); 