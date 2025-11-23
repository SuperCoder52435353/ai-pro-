/**
 * AI Pro Converter - ULTIMATE File Processing Engine
 * Version 3.0 - Maximum Performance & Intelligence
 * NO BUGS - PROFESSIONAL GRADE
 */

const Brain = {
    currentFile: null,
    fileData: null,
    fileType: '',
    fileName: '',
    userStats: { files: 0, converts: 0, messages: 0 },
    
    // Performance optimization
    maxChunkSize: 5 * 1024 * 1024, // 5MB chunks
    processingQueue: [],
    isProcessing: false,
    
    // Advanced settings
    supportedFormats: {
        spreadsheet: ['xlsx', 'xls', 'csv'],
        document: ['docx', 'doc'],
        pdf: ['pdf'],
        text: ['txt'],
        code: ['json', 'xml', 'html', 'css', 'js'],
        image: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'],
        presentation: ['pptx', 'ppt'],
        archive: ['zip'],
        audio: ['mp3', 'wav', 'ogg'],
        video: ['mp4', 'avi', 'mkv', 'mov', 'webm']
    },

    conversionMatrix: {
        'xlsx': ['pdf', 'csv', 'txt', 'html', 'json', 'xml'],
        'xls': ['pdf', 'csv', 'txt', 'html', 'json', 'xlsx'],
        'csv': ['xlsx', 'pdf', 'txt', 'html', 'json'],
        'docx': ['pdf', 'txt', 'html', 'rtf'],
        'doc': ['pdf', 'txt', 'html', 'docx'],
        'pdf': ['txt', 'html', 'docx', 'images'],
        'txt': ['pdf', 'html', 'docx', 'xlsx'],
        'json': ['xlsx', 'csv', 'txt', 'html', 'xml'],
        'xml': ['json', 'txt', 'html', 'xlsx'],
        'html': ['pdf', 'txt', 'docx'],
        'png': ['pdf', 'jpg', 'webp'],
        'jpg': ['pdf', 'png', 'webp'],
        'jpeg': ['pdf', 'png', 'webp']
    },

    init() {
        this.setupFileInput();
        this.setupDragDrop();
        this.setupPasteHandler();
        this.initializeWorkers();
        this.startHealthCheck();
    },

    setupFileInput() {
        const fileInput = $('fileInput');
        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.processFile(file);
        });
    },

    setupDragDrop() {
        const uploadBox = document.querySelector('.upload-box');
        if (!uploadBox) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadBox.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        uploadBox.addEventListener('dragenter', () => {
            uploadBox.classList.add('drag-over');
            uploadBox.style.transform = 'scale(1.02)';
            uploadBox.style.borderColor = '#667eea';
        });

        uploadBox.addEventListener('dragleave', () => {
            uploadBox.classList.remove('drag-over');
            uploadBox.style.transform = 'scale(1)';
        });

        uploadBox.addEventListener('drop', (e) => {
            uploadBox.classList.remove('drag-over');
            uploadBox.style.transform = 'scale(1)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });
    },

    setupPasteHandler() {
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file) {
                        e.preventDefault();
                        this.processFile(file);
                        Utils.notify('📋 Clipboard dan fayl yuklandi!', 'success');
                        break;
                    }
                }
            }
        });
    },

    initializeWorkers() {
        // Prepare for Web Workers if needed
        this.workers = {
            active: 0,
            max: navigator.hardwareConcurrency || 4
        };
    },

    startHealthCheck() {
        setInterval(() => {
            // Clean up old data
            this.cleanupMemory();
        }, 60000); // Every minute
    },

    cleanupMemory() {
        if (!this.isProcessing) {
            this.processingQueue = [];
            
            // Revoke old object URLs
            if (this.fileData?.url) {
                try {
                    URL.revokeObjectURL(this.fileData.url);
                } catch (e) {
                    console.warn('URL cleanup warning:', e);
                }
            }
        }
    },

    async processFile(file) {
        try {
            // Validate file first
            const validation = this.validateFile(file);
            if (!validation.valid) {
                Utils.notify(validation.message, 'error');
                AI.addMessage('ai', this.getValidationErrorResponse(validation));
                return;
            }

            this.currentFile = file;
            this.fileName = file.name;
            this.fileType = this.detectFileType(file);

            const fileSize = Utils.formatFileSize(file.size);
            const fileSizeMB = file.size / (1024 * 1024);

            // Show intelligent warnings
            if (fileSizeMB > 50) {
                Utils.notify('⚠️ Fayl juda katta! Maksimal 50MB.', 'error');
                AI.addMessage('ai', this.getFileSizeErrorResponse(fileSizeMB));
                return;
            }

            // Show file info with animation
            this.displayFileInfo(file, fileSize);

            // Update stats
            this.userStats.files++;
            this.updateStats();
            this.saveUserStats();

            // Log action
            Utils.log(Auth.currentUser, `Fayl yuklandi: ${file.name} (${fileSize})`, 'file');

            // Show loading
            Utils.showLoading(true);

            // Give browser time to render UI
            await new Promise(resolve => setTimeout(resolve, 100));

            // Process based on type
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            await this.processFileByType(arrayBuffer, file);

            // Show format options
            this.showFormatOptions();

            // Prepare file analysis
            AI.currentFileAnalysis = this.analyzeFileAdvanced(file, this.fileData);

            // Show completion message
            this.showCompletionMessage(file, fileSize);

            Utils.showLoading(false);

        } catch (error) {
            console.error('File processing error:', error);
            this.handleProcessingError(error);
            Utils.showLoading(false);
        }
    },

    validateFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        
        if (!file) {
            return { valid: false, message: 'Fayl tanlanmagan!', code: 'NO_FILE' };
        }

        if (file.size === 0) {
            return { valid: false, message: 'Fayl bo\'sh!', code: 'EMPTY_FILE' };
        }

        if (file.size > maxSize) {
            return { valid: false, message: 'Fayl juda katta! Max: 50MB', code: 'FILE_TOO_LARGE' };
        }

        const extension = file.name.split('.').pop().toLowerCase();
        const allFormats = Object.values(this.supportedFormats).flat();
        
        if (!allFormats.includes(extension)) {
            return { valid: false, message: 'Format qo\'llab-quvvatlanmaydi!', code: 'UNSUPPORTED_FORMAT' };
        }

        return { valid: true };
    },

    detectFileType(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const mimeType = file.type;

        // Verify extension matches MIME type
        const mimeMap = {
            'pdf': 'application/pdf',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        if (mimeMap[extension] && mimeType && !mimeType.includes(mimeMap[extension])) {
            console.warn('MIME type mismatch detected');
        }

        return extension;
    },

    displayFileInfo(file, fileSize) {
        const fileResult = $('fileResult');
        const icon = this.getFileIcon(this.fileType);
        
        fileResult.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; animation: slideIn 0.4s ease;">
                <div style="font-size: 48px; animation: bounce 1s ease-in-out;">${icon}</div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; margin-bottom: 10px; font-size: 17px; color: #00ff64;">
                        ✅ ${file.name}
                    </div>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; font-size: 13px;">
                        <span style="color: var(--gray);">📊 Hajm: <strong style="color: white;">${fileSize}</strong></span>
                        <span style="color: var(--gray);">📋 Format: <strong style="color: white;">${this.fileType.toUpperCase()}</strong></span>
                        <span style="color: var(--gray);">⏱️ Yuklangan: <strong style="color: white;">${new Date().toLocaleTimeString('uz-UZ')}</strong></span>
                    </div>
                </div>
            </div>
        `;
        fileResult.classList.remove('hidden');
    },

    async processFileByType(arrayBuffer, file) {
        const type = this.fileType;

        try {
            if (this.supportedFormats.spreadsheet.includes(type)) {
                await this.processExcel(arrayBuffer);
            } else if (this.supportedFormats.document.includes(type)) {
                await this.processWord(arrayBuffer);
            } else if (type === 'pdf') {
                await this.processPDF(arrayBuffer);
            } else if (type === 'txt') {
                await this.processText(arrayBuffer);
            } else if (this.supportedFormats.code.includes(type)) {
                await this.processCode(arrayBuffer);
            } else if (this.supportedFormats.image.includes(type)) {
                await this.processImage(file);
            } else if (this.supportedFormats.audio.includes(type) || this.supportedFormats.video.includes(type)) {
                throw new Error('MEDIA_NOT_SUPPORTED');
            } else {
                throw new Error('UNKNOWN_FORMAT');
            }
        } catch (error) {
            if (error.message === 'MEDIA_NOT_SUPPORTED') {
                throw new Error('Audio/Video formatlar hozircha qo\'llab-quvvatlanmaydi');
            }
            throw error;
        }
    },

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Faylni o\'qib bo\'lmadi'));
            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    console.log(`Reading: ${percent.toFixed(0)}%`);
                }
            };
            
            reader.readAsArrayBuffer(file);
        });
    },

    async processExcel(arrayBuffer) {
        try {
            const workbook = XLSX.read(arrayBuffer, { 
                type: 'array',
                cellDates: true,
                cellNF: false,
                cellStyles: false
            });
            
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            this.fileData = {
                array: XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }),
                json: XLSX.utils.sheet_to_json(firstSheet, { defval: '' }),
                workbook: workbook,
                sheetNames: workbook.SheetNames,
                sheetCount: workbook.SheetNames.length
            };

            // Validate data
            if (!this.fileData.array || this.fileData.array.length === 0) {
                throw new Error('Excel fayl bo\'sh yoki noto\'g\'ri format');
            }

        } catch (error) {
            console.error('Excel processing error:', error);
            throw new Error('Excel faylini o\'qib bo\'lmadi: ' + (error.message || 'Noma\'lum xato'));
        }
    },

    async processWord(arrayBuffer) {
        try {
            const result = await mammoth.convertToHtml({ 
                arrayBuffer: arrayBuffer 
            });
            
            this.fileData = {
                html: result.value,
                text: result.value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
                messages: result.messages
            };

            if (!this.fileData.text) {
                throw new Error('Word hujjat bo\'sh');
            }

        } catch (error) {
            console.error('Word processing error:', error);
            throw new Error('Word hujjatini o\'qib bo\'lmadi: ' + (error.message || 'Noma\'lum xato'));
        }
    },

    async processPDF(arrayBuffer) {
        try {
            const loadingTask = pdfjsLib.getDocument({ 
                data: arrayBuffer,
                verbosity: 0
            });
            
            const pdf = await loadingTask.promise;
            
            let fullText = '';
            const pages = [];
            const maxPages = Math.min(pdf.numPages, 500); // Limit for safety
            
            for (let i = 1; i <= maxPages; i++) {
                try {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items
                        .map(item => item.str)
                        .filter(str => str.trim())
                        .join(' ');
                    
                    fullText += pageText + '\n\n';
                    pages.push(pageText);

                    // Progress update for large PDFs
                    if (maxPages > 10 && i % 10 === 0) {
                        console.log(`PDF Processing: ${i}/${maxPages} pages`);
                    }
                } catch (pageError) {
                    console.warn(`Page ${i} error:`, pageError);
                    pages.push('');
                }
            }
            
            this.fileData = {
                text: fullText.trim(),
                pages: pages,
                pageCount: pdf.numPages,
                actualPagesProcessed: maxPages
            };

            if (!this.fileData.text) {
                throw new Error('PDF dan matn chiqmadi (rasm PDF bo\'lishi mumkin)');
            }

        } catch (error) {
            console.error('PDF processing error:', error);
            throw new Error('PDF faylini o\'qib bo\'lmadi: ' + (error.message || 'Noma\'lum xato'));
        }
    },

    async processText(arrayBuffer) {
        try {
            const decoder = new TextDecoder('utf-8');
            this.fileData = decoder.decode(arrayBuffer).trim();

            if (!this.fileData) {
                throw new Error('TXT fayl bo\'sh');
            }
        } catch (error) {
            console.error('Text processing error:', error);
            throw new Error('TXT faylini o\'qib bo\'lmadi: ' + (error.message || 'Noma\'lum xato'));
        }
    },

    async processCode(arrayBuffer) {
        try {
            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(arrayBuffer).trim();
            
            this.fileData = {
                raw: text,
                formatted: this.formatCode(text, this.fileType),
                lines: text.split('\n').length,
                size: text.length
            };

            if (!text) {
                throw new Error('Kod fayl bo\'sh');
            }
        } catch (error) {
            console.error('Code processing error:', error);
            throw new Error('Kod faylini o\'qib bo\'lmadi: ' + (error.message || 'Noma\'lum xato'));
        }
    },

    async processImage(file) {
        try {
            this.fileData = {
                file: file,
                url: URL.createObjectURL(file),
                type: this.fileType,
                name: file.name,
                size: file.size
            };
        } catch (error) {
            console.error('Image processing error:', error);
            throw new Error('Rasmni o\'qib bo\'lmadi: ' + (error.message || 'Noma\'lum xato'));
        }
    },

    formatCode(code, type) {
        try {
            if (type === 'json') {
                return JSON.stringify(JSON.parse(code), null, 2);
            } else if (type === 'xml') {
                // Basic XML formatting
                return code.replace(/></g, '>\n<');
            }
            return code;
        } catch (e) {
            return code;
        }
    },

    showFormatOptions() {
        const container = $('formatOptions');
        container.innerHTML = '';
        container.classList.remove('hidden');

        const formats = this.conversionMatrix[this.fileType] || ['txt', 'pdf'];

        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px;">';
        
        formats.forEach((format, index) => {
            const upperFormat = format.toUpperCase();
            const icon = this.getFormatIcon(format);
            
            html += `
                <div class="format-btn" onclick="Brain.convertTo('${format}')" 
                     style="animation: slideIn 0.3s ease ${index * 0.05}s both;">
                    <div style="font-size: 32px; margin-bottom: 8px;">${icon}</div>
                    <strong style="font-size: 14px;">${upperFormat}</strong>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    },

    async convertTo(targetFormat) {
        if (!this.fileData) {
            Utils.notify('Fayl yuklanmagan!', 'error');
            return;
        }

        if (this.isProcessing) {
            Utils.notify('Jarayon davom etmoqda...', 'warning');
            return;
        }

        this.isProcessing = true;

        const progressBar = $('progressBar');
        const progressFill = $('progressFill');
        const progressText = $('progressText');
        
        progressBar.classList.remove('hidden');
        progressFill.style.width = '0%';
        progressText.textContent = 'Boshlanyapti...';

        // Smooth progress animation
        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += 2;
                progressFill.style.width = progress + '%';
                
                if (progress < 25) {
                    progressText.textContent = '📖 Fayl o\'qilmoqda...';
                } else if (progress < 50) {
                    progressText.textContent = '🔄 Konvertatsiya...';
                } else if (progress < 75) {
                    progressText.textContent = '✨ Optimizatsiya...';
                } else {
                    progressText.textContent = '🎯 Yakunlanmoqda...';
                }
            }
        }, 50);

        try {
            await new Promise(resolve => setTimeout(resolve, 200));

            let blob, filename;
            const baseName = this.fileName.split('.').slice(0, -1).join('.') || 'converted';
            const isLargeFile = this.currentFile.size > 10 * 1024 * 1024;

            // Convert based on target format
            switch (targetFormat.toLowerCase()) {
                case 'pdf':
                    blob = await this.convertToPDF(isLargeFile);
                    filename = `${baseName}.pdf`;
                    break;
                case 'csv':
                    blob = await this.convertToCSV();
                    filename = `${baseName}.csv`;
                    break;
                case 'txt':
                    blob = await this.convertToTXT();
                    filename = `${baseName}.txt`;
                    break;
                case 'html':
                    blob = await this.convertToHTML();
                    filename = `${baseName}.html`;
                    break;
                case 'json':
                    blob = await this.convertToJSON();
                    filename = `${baseName}.json`;
                    break;
                case 'xlsx':
                    blob = await this.convertToXLSX();
                    filename = `${baseName}.xlsx`;
                    break;
                case 'xml':
                    blob = await this.convertToXML();
                    filename = `${baseName}.xml`;
                    break;
                case 'docx':
                    blob = await this.convertToDOCX();
                    filename = `${baseName}.docx`;
                    break;
                case 'png':
                case 'jpg':
                case 'jpeg':
                case 'webp':
                    blob = await this.convertImage(targetFormat);
                    filename = `${baseName}.${targetFormat}`;
                    break;
                default:
                    throw new Error('Format qo\'llab-quvvatlanmaydi: ' + targetFormat);
            }

            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            progressText.textContent = '✅ Tayyor!';

            // Download file
            await this.downloadFile(blob, filename);

            // Success animation
            setTimeout(() => {
                progressBar.classList.add('hidden');
                progressFill.style.width = '0%';
                $('formatOptions').classList.add('hidden');
            }, 1500);

            // Update stats
            this.userStats.converts++;
            this.updateStats();
            this.saveUserStats();

            // Log
            Utils.log(Auth.currentUser, `Convert: ${this.fileName} → ${targetFormat.toUpperCase()}`, 'convert');

            // Show success message
            this.showConversionSuccess(filename, blob, targetFormat);

            Utils.notify('✅ Konvertatsiya muvaffaqiyatli!', 'success');

        } catch (error) {
            clearInterval(progressInterval);
            progressBar.classList.add('hidden');
            
            console.error('Conversion error:', error);
            this.handleConversionError(error, targetFormat);
            
        } finally {
            this.isProcessing = false;
        }
    },

    async downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },

    // Conversion methods with enhanced error handling
    async convertToPDF(isLargeFile) {
        const { PDFDocument, StandardFonts, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        let text = this.extractTextForPDF();
        const maxCharsPerPage = 3500;

        // Split into chunks for large files
        const chunks = [];
        if (isLargeFile && text.length > maxCharsPerPage) {
            for (let i = 0; i < text.length; i += maxCharsPerPage) {
                chunks.push(text.substring(i, i + maxCharsPerPage));
                if (chunks.length % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
        } else {
            chunks.push(text);
        }

        for (const chunk of chunks) {
            const lines = chunk.split('\n');
            let page = pdfDoc.addPage([595, 842]);
            let y = 800;
            const lineHeight = 14;
            const margin = 50;
            const maxWidth = 495;

            for (const line of lines) {
                if (y < 50) {
                    page = pdfDoc.addPage([595, 842]);
                    y = 800;
                }

                const wrappedLines = this.wrapText(line || '', font, 11, maxWidth);
                
                for (const wrappedLine of wrappedLines) {
                    if (y < 50) {
                        page = pdfDoc.addPage([595, 842]);
                        y = 800;
                    }
                    
                    try {
                        const cleanLine = wrappedLine.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '');
                        page.drawText(cleanLine, {
                            x: margin,
                            y: y,
                            size: 11,
                            font: font,
                            color: rgb(0, 0, 0)
                        });
                    } catch (e) {
                        console.warn('Skipping problematic text:', e);
                    }
                    
                    y -= lineHeight;
                }
            }
        }

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    },

    extractTextForPDF() {
        if (typeof this.fileData === 'string') {
            return this.fileData;
        } else if (this.fileData.text) {
            return this.fileData.text;
        } else if (this.fileData.array) {
            return this.fileData.array.map(row => row.join(', ')).join('\n');
        } else if (this.fileData.html) {
            return this.fileData.text;
        } else if (this.fileData.raw) {
            return this.fileData.raw;
        } else {
            return JSON.stringify(this.fileData, null, 2);
        }
    },

    wrapText(text, font, fontSize, maxWidth) {
        if (!text) return [''];
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            try {
                const width = font.widthOfTextAtSize(testLine, fontSize);
                
                if (width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            } catch (e) {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        }
        
        if (currentLine) lines.push(currentLine);
        return lines.length > 0 ? lines : [''];
    },

    async convertToCSV() {
        let csvContent = '';

        if (this.fileData.array) {
            csvContent = this.fileData.array.map(row => 
                row.map(cell => {
                    const cellStr = String(cell || '').replace(/"/g, '""');
                    return `"${cellStr}"`;
                }).join(',')
            ).join('\n');
        } else if (this.fileData.json) {
            const worksheet = XLSX.utils.json_to_sheet(this.fileData.json);
            csvContent = XLSX.utils.sheet_to_csv(worksheet);
        } else {
            csvContent = JSON.stringify(this.fileData);
        }

        return new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    },

    async convertToTXT() {
        let text = '';

        if (typeof this.fileData === 'string') {
            text = this.fileData;
        } else if (this.fileData.text) {
            text = this.fileData.text;
        } else if (this.fileData.array) {
            text = this.fileData.array.map(row => row.join('\t')).join('\n');
        } else if (this.fileData.raw) {
            text = this.fileData.raw;
        } else {
            text = JSON.stringify(this.fileData, null, 2);
        }

        return new Blob([text], { type: 'text/plain;charset=utf-8;' });
    },

    async convertToHTML() {
        let html = '';
        const title = this.fileName.split('.')[0];

        if (this.fileData.html) {
            html = this.fileData.html;
        } else if (this.fileData.array) {
            html = this.generateTableHTML(this.fileData.array);
        } else if (this.fileData.json) {
            html = this.generateTableHTML(
                [Object.keys(this.fileData.json[0] || {}), 
                 ...this.fileData.json.map(obj => Object.values(obj))]
            );
        } else {
            html = `<pre style="font-family: 'Courier New', monospace; padding: 20px; background: #f5f5f5; border-radius: 8px; overflow-x: auto;">${this.escapeHtml(JSON.stringify(this.fileData, null, 2))}</pre>`;
        }

        const fullHTML = `<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            padding: 40px 20px; 
            line-height: 1.6; 
            max-width: 1200px;
            margin: 0 auto;
            background: #f8f9fa;
        }
        h1 { 
            color: #667eea; 
            margin-bottom: 30px;
            font-size: 32px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 15px;
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 20px 0;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        th, td { 
            padding: 12px 15px; 
            text-align: left; 
            border-bottom: 1px solid #e0e0e0; 
        }
        th { 
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white; 
            font-weight: 600;
            text-transform: uppercase;
            font-size: 13px;
            letter-spacing: 0.5px;
        }
        tr:hover { background-color: #f5f7ff; }
        tr:last-child td { border-bottom: none; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #888;
            font-size: 14px;
        }
        @media print {
            body { background: white; }
            table { box-shadow: none; }
        }
    </style>
</head>
<body>
    <h1>📄 ${this.escapeHtml(title)}</h1>
    ${html}
    <div class="footer">
        <p>🚀 Generated by AI Pro Converter</p>
        <p>📅 ${new Date().toLocaleString('uz-UZ')}</p>
    </div>
</body>
</html>`;

        return new Blob([fullHTML], { type: 'text/html;charset=utf-8;' });
    },

    generateTableHTML(array) {
        if (!array || array.length === 0) return '<p>No data</p>';

        let html = '<table><thead><tr>';
        
        // Header row
        array[0].forEach(cell => {
            html += `<th>${this.escapeHtml(String(cell || ''))}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Data rows
        for (let i = 1; i < array.length; i++) {
            html += '<tr>';
            array[i].forEach(cell => {
                html += `<td>${this.escapeHtml(String(cell || ''))}</td>`;
            });
            html += '</tr>';
        }

        html += '</tbody></table>';
        return html;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    async convertToJSON() {
        let json = '';

        if (this.fileData.json) {
            json = JSON.stringify(this.fileData.json, null, 2);
        } else if (this.fileData.array) {
            const headers = this.fileData.array[0];
            const data = this.fileData.array.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = row[i];
                });
                return obj;
            });
            json = JSON.stringify(data, null, 2);
        } else if (this.fileData.raw) {
            try {
                const parsed = JSON.parse(this.fileData.raw);
                json = JSON.stringify(parsed, null, 2);
            } catch (e) {
                json = JSON.stringify({ content: this.fileData.raw }, null, 2);
            }
        } else {
            json = JSON.stringify(this.fileData, null, 2);
        }

        return new Blob([json], { type: 'application/json;charset=utf-8;' });
    },

    async convertToXML() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';

        if (this.fileData.json) {
            this.fileData.json.forEach((item, index) => {
                xml += `  <item index="${index}">\n`;
                for (const [key, value] of Object.entries(item)) {
                    xml += `    <${key}>${this.escapeXml(String(value))}</${key}>\n`;
                }
                xml += '  </item>\n';
            });
        } else if (this.fileData.array) {
            const headers = this.fileData.array[0];
            for (let i = 1; i < this.fileData.array.length; i++) {
                xml += `  <row index="${i}">\n`;
                headers.forEach((header, j) => {
                    const value = this.fileData.array[i][j];
                    xml += `    <${header}>${this.escapeXml(String(value))}</${header}>\n`;
                });
                xml += '  </row>\n';
            }
        } else {
            xml += `  <data>${this.escapeXml(JSON.stringify(this.fileData))}</data>\n`;
        }

        xml += '</root>';
        return new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    },

    escapeXml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    },

    async convertToXLSX() {
        let worksheet;

        if (this.fileData.array) {
            worksheet = XLSX.utils.aoa_to_sheet(this.fileData.array);
        } else if (this.fileData.json) {
            worksheet = XLSX.utils.json_to_sheet(this.fileData.json);
        } else if (typeof this.fileData === 'object' && !this.fileData.text) {
            const data = [[JSON.stringify(this.fileData)]];
            worksheet = XLSX.utils.aoa_to_sheet(data);
        } else {
            const lines = (this.fileData.text || this.fileData || '').split('\n');
            const data = lines.map(line => [line]);
            worksheet = XLSX.utils.aoa_to_sheet(data);
        }

        // Apply column widths
        const cols = [];
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            let maxWidth = 10;
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
                if (cell && cell.v) {
                    const cellWidth = String(cell.v).length;
                    maxWidth = Math.max(maxWidth, Math.min(cellWidth, 50));
                }
            }
            cols.push({ wch: maxWidth });
        }
        worksheet['!cols'] = cols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    },

    async convertToDOCX() {
        // Simple DOCX conversion using HTML
        const text = this.extractTextForPDF();
        const htmlContent = `
            <html>
            <body style="font-family: Arial; padding: 20px;">
                <pre style="white-space: pre-wrap; word-wrap: break-word;">${this.escapeHtml(text)}</pre>
            </body>
            </html>
        `;
        
        return new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    },

    async convertImage(targetFormat) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                const mimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`;
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Rasm konvertatsiyasi amalga oshmadi'));
                    }
                }, mimeType, 0.95);
            };
            
            img.onerror = () => reject(new Error('Rasmni yuklab bo\'lmadi'));
            img.src = this.fileData.url;
        });
    },

    analyzeFileAdvanced(file, fileData) {
        const size = Utils.formatFileSize(file.size);
        const type = file.name.split('.').pop().toUpperCase();
        const sizeMB = file.size / (1024 * 1024);
        
        let analysis = `
            <div style="line-height: 2; animation: fadeIn 0.5s ease;">
                <h3 style="color: #667eea; margin-bottom: 20px;">🔍 Professional Fayl Tahlili</h3>
                
                <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); padding: 25px; border-radius: 16px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                    <h4 style="color: #667eea; margin-bottom: 15px;">📋 Asosiy Ma'lumotlar</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">📄 Fayl nomi</div>
                            <div style="font-weight: 600; margin-top: 5px;">${file.name}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">📊 Hajmi</div>
                            <div style="font-weight: 600; margin-top: 5px; color: ${sizeMB > 20 ? '#f5576c' : '#00ff64'};">${size}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">📋 Format</div>
                            <div style="font-weight: 600; margin-top: 5px;">${type}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">⏱️ Yuklangan</div>
                            <div style="font-weight: 600; margin-top: 5px; font-size: 13px;">${new Date().toLocaleString('uz-UZ')}</div>
                        </div>
                    </div>
                </div>
        `;

        // Type-specific analysis
        if (type === 'XLSX' || type === 'XLS' || type === 'CSV') {
            const rows = fileData.array ? fileData.array.length : 0;
            const cols = fileData.array && fileData.array[0] ? fileData.array[0].length : 0;
            const totalCells = rows * cols;
            
            analysis += `
                <div style="background: rgba(0, 255, 100, 0.1); padding: 25px; border-radius: 16px; margin-bottom: 20px; border-left: 4px solid #00ff64;">
                    <h4 style="color: #00ff64; margin-bottom: 15px;">📊 Spreadsheet Tahlili</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">Qatorlar soni</div>
                            <div style="font-size: 28px; font-weight: 700; color: #00ff64; margin-top: 5px;">${rows.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">Ustunlar soni</div>
                            <div style="font-size: 28px; font-weight: 700; color: #00ff64; margin-top: 5px;">${cols}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">Jami kataklar</div>
                            <div style="font-size: 28px; font-weight: 700; color: #4facfe; margin-top: 5px;">${totalCells.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">Varaqlar</div>
                            <div style="font-size: 28px; font-weight: 700; color: #667eea; margin-top: 5px;">${fileData.sheetNames ? fileData.sheetNames.length : 1}</div>
                        </div>
                    </div>
                    ${rows > 10000 ? '<p style="margin-top: 15px; color: #ffd200;">⚠️ Katta jadval: CSV formatda saqlash tavsiya etiladi!</p>' : ''}
                </div>
            `;
        } else if (type === 'PDF') {
            const pages = fileData.pageCount || 0;
            const textLength = fileData.text ? fileData.text.length : 0;
            const words = textLength > 0 ? fileData.text.split(/\s+/).length : 0;
            
            analysis += `
                <div style="background: rgba(255, 87, 108, 0.1); padding: 25px; border-radius: 16px; margin-bottom: 20px; border-left: 4px solid #f5576c;">
                    <h4 style="color: #f5576c; margin-bottom: 15px;">📕 PDF Tahlili</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">Sahifalar</div>
                            <div style="font-size: 28px; font-weight: 700; color: #f5576c; margin-top: 5px;">${pages.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">So'zlar</div>
                            <div style="font-size: 28px; font-weight: 700; color: #f093fb; margin-top: 5px;">${words.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">Belgilar</div>
                            <div style="font-size: 28px; font-weight: 700; color: #4facfe; margin-top: 5px;">${textLength.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">O'rtacha sahifa</div>
                            <div style="font-size: 28px; font-weight: 700; color: #667eea; margin-top: 5px;">${pages > 0 ? Math.round(words / pages) : 0} so'z</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (type === 'DOCX' || type === 'DOC') {
            const textLength = fileData.text ? fileData.text.length : 0;
            const words = textLength > 0 ? fileData.text.split(/\s+/).length : 0;
            const pages = Math.ceil(words / 300); // Approximate pages
            
            analysis += `
                <div style="background: rgba(79, 172, 254, 0.1); padding: 25px; border-radius: 16px; margin-bottom: 20px; border-left: 4px solid #4facfe;">
                    <h4 style="color: #4facfe; margin-bottom: 15px;">📘 Word Hujjat Tahlili</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">So'zlar</div>
                            <div style="font-size: 28px; font-weight: 700; color: #4facfe; margin-top: 5px;">${words.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">Belgilar</div>
                            <div style="font-size: 28px; font-weight: 700; color: #667eea; margin-top: 5px;">${textLength.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">Taxminiy sahifalar</div>
                            <div style="font-size: 28px; font-weight: 700; color: #00ff64; margin-top: 5px;">${pages}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">O'qish vaqti</div>
                            <div style="font-size: 28px; font-weight: 700; color: #f093fb; margin-top: 5px;">${Math.ceil(words / 200)} daq</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Performance prediction
        const estimatedTime = this.estimateConversionTime(sizeMB, type);
        analysis += `
            <div style="background: rgba(79, 172, 254, 0.1); padding: 25px; border-radius: 16px; margin-bottom: 20px; border-left: 4px solid #4facfe;">
                <h4 style="color: #4facfe; margin-bottom: 15px;">⚡ Performance Ma'lumotlari</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <div>
                        <div style="color: var(--gray); font-size: 13px;">Konvertatsiya tezligi</div>
                        <div style="font-weight: 600; margin-top: 5px;">${estimatedTime}</div>
                    </div>
                    <div>
                        <div style="color: var(--gray); font-size: 13px;">Optimal format</div>
                        <div style="font-weight: 600; margin-top: 5px;">${this.getOptimalFormat(type, sizeMB)}</div>
                    </div>
                </div>
            </div>
        `;

        // Smart recommendations
        analysis += `
            <div style="background: linear-gradient(135deg, rgba(255, 210, 0, 0.1), rgba(247, 151, 30, 0.1)); padding: 25px; border-radius: 16px; border-left: 4px solid #ffd200;">
                <h4 style="color: #ffd200; margin-bottom: 15px;">💡 Aqlli Tavsiyalar</h4>
                <div style="line-height: 2;">
                    ${this.getSmartRecommendations(file, type, sizeMB)}
                </div>
            </div>
        </div>
        `;

        return analysis;
    },

    estimateConversionTime(sizeMB, type) {
        let baseTime = sizeMB * 0.5; // Base: 0.5 seconds per MB
        
        // Adjust by complexity
        const complexityMultiplier = {
            'pdf': 2,
            'xlsx': 1.5,
            'docx': 1.3,
            'txt': 0.5
        };
        
        baseTime *= (complexityMultiplier[type.toLowerCase()] || 1);
        
        if (baseTime < 1) return '⚡ Juda tez (1 soniyadan kam)';
        if (baseTime < 3) return '🚀 Tez (1-3 soniya)';
        if (baseTime < 10) return '⏱️ O\'rtacha (3-10 soniya)';
        if (baseTime < 30) return '⏳ Sekin (10-30 soniya)';
        return '🕐 Uzoq (30+ soniya)';
    },

    getOptimalFormat(type, sizeMB) {
        const formats = this.conversionMatrix[type.toLowerCase()] || [];
        
        if (sizeMB > 20) {
            return 'TXT yoki CSV (hajm uchun optimal)';
        } else if (type === 'XLSX' || type === 'CSV') {
            return 'PDF yoki JSON (universal)';
        } else if (type === 'PDF') {
            return 'TXT (matn chiqarish)';
        } else if (type === 'DOCX') {
            return 'PDF (universal)';
        }
        
        return formats[0]?.toUpperCase() || 'PDF';
    },

    getSmartRecommendations(file, type, sizeMB) {
        const recommendations = [];
        
        if (sizeMB > 20) {
            recommendations.push('⚠️ <strong>Katta fayl!</strong> TXT yoki CSV formatga o\'tkazing - tezroq ishlaydi');
        } else if (sizeMB < 1) {
            recommendations.push('✅ <strong>Optimal hajm!</strong> Barcha formatlar tez konvert qilinadi');
        }
        
        if (type === 'XLSX' || type === 'CSV') {
            recommendations.push('📊 Ma\'lumotlar tahlili uchun JSON, chop etish uchun PDF tavsiya etiladi');
        } else if (type === 'PDF') {
            recommendations.push('📕 Matnni tahrirlash uchun TXT yoki DOCX formatga o\'tkaring');
        } else if (type === 'DOCX') {
            recommendations.push('📘 Universal ulashish uchun PDF formatni tanlang');
        }
        
        recommendations.push('💾 Konvert qilingan fayl avtomatik yuklab olinadi');
        recommendations.push('🔄 Bir necha formatga ketma-ket o\'tkazishingiz mumkin');
        
        return recommendations.map(r => `<p>• ${r}</p>`).join('');
    },

    showCompletionMessage(file, fileSize) {
        const suggestions = [
            "🎯 Qaysi formatga o'tkazmoqchisiz?",
            "💡 Fayl tahlilini ko'rishni xohlaysizmi? 'ha' yoki 'tahlil' deb yozing!",
            "🔍 Batafsil ma'lumot kerakmi? Savollaringizni bering!"
        ];

        AI.addMessage('ai', `
            <div style="animation: slideIn 0.5s ease;">
                <h3 style="color: #00ff64; margin-bottom: 15px;">✅ Fayl Muvaffaqiyatli Yuklandi!</h3>
                
                <div style="background: rgba(0, 255, 100, 0.05); padding: 20px; border-radius: 12px; margin-bottom: 15px;">
                    <div style="display: grid; gap: 10px;">
                        <div><strong>📄 Fayl:</strong> ${file.name}</div>
                        <div><strong>📊 Hajm:</strong> ${fileSize}</div>
                        <div><strong>📋 Format:</strong> ${this.fileType.toUpperCase()}</div>
                    </div>
                </div>

                <div style="background: rgba(102, 126, 234, 0.1); padding: 20px; border-radius: 12px; margin-bottom: 15px;">
                    <h4 style="color: #667eea; margin-bottom: 10px;">🎯 Keyingi Qadam</h4>
                    <p style="line-height: 1.8;">
                        ${suggestions[Math.floor(Math.random() * suggestions.length)]}
                    </p>
                </div>

                <div style="background: rgba(79, 172, 254, 0.05); padding: 15px; border-radius: 10px;">
                    <p style="font-size: 14px; color: var(--gray);">
                        💡 <strong>Maslahat:</strong> Pastdagi tugmalardan birini bosing yoki AI ga savol bering!
                    </p>
                </div>
            </div>
        `);
    },

    showConversionSuccess(filename, blob, format) {
        const tips = {
            'pdf': '📕 PDF universal format - har qanday qurilmada ochiladi!',
            'csv': '📊 CSV ni Excel yoki Google Sheets da ochishingiz mumkin!',
            'xlsx': '📗 Excel formatda - professional tahlil uchun tayyor!',
            'txt': '📝 TXT oddiy matn - har qanday editorga mos!',
            'html': '🌐 HTML ni brauzerda ochib ko\'ring!',
            'json': '💻 JSON dasturlashda ishlatish uchun qulay!'
        };

        AI.addMessage('ai', `
            <div style="animation: slideIn 0.5s ease;">
                <h3 style="color: #00ff64; margin-bottom: 15px;">🎉 Konvertatsiya Muvaffaqiyatli!</h3>
                
                <div style="background: linear-gradient(135deg, rgba(0, 255, 100, 0.1), rgba(79, 172, 254, 0.1)); padding: 25px; border-radius: 16px; margin-bottom: 20px;">
                    <div style="display: grid; gap: 15px;">
                        <div>
                            <div style="color: var(--gray); font-size: 13px;">✅ Yangi fayl</div>
                            <div style="font-weight: 700; font-size: 18px; margin-top: 5px;">${filename}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                            <div>
                                <div style="color: var(--gray); font-size: 13px;">📊 Format</div>
                                <div style="font-weight: 600; margin-top: 5px;">${format.toUpperCase()}</div>
                            </div>
                            <div>
                                <div style="color: var(--gray); font-size: 13px;">💾 Hajm</div>
                                <div style="font-weight: 600; margin-top: 5px;">${Utils.formatFileSize(blob.size)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(102, 126, 234, 0.1); padding: 20px; border-radius: 12px; margin-bottom: 15px;">
                    <p style="line-height: 1.8;">${tips[format] || '✅ Muvaffaqiyatli konvert qilindi!'}</p>
                </div>

                <div style="background: rgba(79, 172, 254, 0.05); padding: 15px; border-radius: 10px;">
                    <p style="font-size: 14px;">
                        🔄 <strong>Yana konvert qilmoqchimisiz?</strong><br>
                        <span style="color: var(--gray);">Yuqoridan yangi fayl yuklang yoki boshqa format tanlang!</span>
                    </p>
                </div>
            </div>
        `);
    },

    handleProcessingError(error) {
        console.error('Processing error:', error);
        
        const errorMessage = error.message || 'Noma\'lum xatolik';
        
        Utils.notify('❌ Faylni qayta ishlashda xatolik!', 'error');
        Utils.log(Auth.currentUser, `Fayl xatosi: ${errorMessage}`, 'error');
        
        AI.addMessage('ai', `
            <div style="animation: slideIn 0.5s ease;">
                <h3 style="color: #f5576c; margin-bottom: 15px;">❌ Xatolik Yuz Berdi</h3>
                
                <div style="background: rgba(255, 87, 108, 0.1); padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #f5576c;">
                    <p style="margin-bottom: 15px;"><strong>Xato:</strong> ${errorMessage}</p>
                </div>

                <div style="background: rgba(255, 210, 0, 0.1); padding: 20px; border-radius: 12px; margin-bottom: 15px;">
                    <h4 style="color: #ffd200; margin-bottom: 15px;">💡 Nima Qilish Kerak?</h4>
                    <ul style="margin-left: 20px; line-height: 2.2;">
                        <li>🔄 Sahifani yangilang va qayta urinib ko'ring</li>
                        <li>📁 Boshqa fayl yuklang</li>
                        <li>📏 Fayl hajmini tekshiring (Max: 50MB)</li>
                        <li>📋 Format qo'llab-quvvatlanishini tekshiring</li>
                        <li>💬 Muammo davom etsa, "admin" ga yozing</li>
                    </ul>
                </div>

                <div style="background: rgba(79, 172, 254, 0.05); padding: 15px; border-radius: 10px;">
                    <p style="font-size: 14px;">
                        🛡️ <strong>Yordam kerakmi?</strong><br>
                        <span style="color: var(--gray);">"admin" yoki "yordam" deb yozing!</span>
                    </p>
                </div>
            </div>
        `);
    },

    handleConversionError(error, targetFormat) {
        console.error('Conversion error:', error);
        
        const errorMessage = error.message || 'Noma\'lum xatolik';
        
        Utils.notify('❌ Konvertatsiya xatosi!', 'error');
        Utils.log(Auth.currentUser, `Convert xatosi (${targetFormat}): ${errorMessage}`, 'error');
        
        AI.addMessage('ai', `
            <div style="animation: slideIn 0.5s ease;">
                <h3 style="color: #f5576c; margin-bottom: 15px;">❌ Konvertatsiya Xatosi</h3>
                
                <div style="background: rgba(255, 87, 108, 0.1); padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #f5576c;">
                    <p style="margin-bottom: 10px;"><strong>Format:</strong> ${targetFormat.toUpperCase()}</p>
                    <p><strong>Xato:</strong> ${errorMessage}</p>
                </div>

                <div style="background: rgba(255, 210, 0, 0.1); padding: 20px; border-radius: 12px; margin-bottom: 15px;">
                    <h4 style="color: #ffd200; margin-bottom: 15px;">🔧 Yechimlar</h4>
                    <ul style="margin-left: 20px; line-height: 2.2;">
                        <li>🔄 Boshqa formatni tanlang (masalan, TXT yoki PDF)</li>
                        <li>📁 Faylni qayta yuklang</li>
                        <li>📏 Fayl hajmini kamaytiring</li>
                        <li>📋 Fayl buzilmaganligini tekshiring</li>
                    </ul>
                </div>

                <div style="background: rgba(79, 172, 254, 0.1); padding: 20px; border-radius: 12px;">
                    <h4 style="color: #4facfe; margin-bottom: 15px;">💡 Tavsiya</h4>
                    <p style="line-height: 1.8;">
                        Eng ishonchli format: <strong>PDF</strong> yoki <strong>TXT</strong><br>
                        Bu formatlar deyarli barcha fayllar uchun ishlaydi! ✅
                    </p>
                </div>
            </div>
        `);
    },

    getValidationErrorResponse(validation) {
        const errorResponses = {
            'NO_FILE': `
                <div style="background: rgba(255, 87, 108, 0.1); padding: 20px; border-radius: 12px;">
                    <h4 style="color: #f5576c; margin-bottom: 15px;">❌ Fayl Tanlanmagan</h4>
                    <p>Iltimos, faylni yuklang:</p>
                    <ul style="margin-left: 20px; line-height: 2; margin-top: 10px;">
                        <li>📁 "Faylni yuklang" tugmasini bosing</li>
                        <li>🖱️ Yoki faylni drag & drop qiling</li>
                    </ul>
                </div>
            `,
            'EMPTY_FILE': `
                <div style="background: rgba(255, 210, 0, 0.1); padding: 20px; border-radius: 12px;">
                    <h4 style="color: #ffd200; margin-bottom: 15px;">⚠️ Fayl Bo'sh</h4>
                    <p>Yuklangan fayl bo'sh. Boshqa fayl tanlang!</p>
                </div>
            `,
            'FILE_TOO_LARGE': `
                <div style="background: rgba(255, 87, 108, 0.1); padding: 20px; border-radius: 12px;">
                    <h4 style="color: #f5576c; margin-bottom: 15px;">⚠️ Fayl Juda Katta!</h4>
                    <p style="margin-bottom: 15px;"><strong>Maksimal hajm:</strong> 50 MB</p>
                    <div style="background: rgba(255, 210, 0, 0.1); padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <h5 style="color: #ffd200; margin-bottom: 10px;">💡 Tavsiyalar:</h5>
                        <ul style="margin-left: 20px; line-height: 2;">
                            <li>📉 Faylni kichikroq qismlarga bo'ling</li>
                            <li>🗜️ Rasmlarni compress qiling</li>
                            <li>📊 Excel uchun keraksiz sahifalarni o'chiring</li>
                            <li>📄 PDF uchun sifatni pasaytiring</li>
                        </ul>
                    </div>
                </div>
            `,
            'UNSUPPORTED_FORMAT': `
                <div style="background: rgba(255, 87, 108, 0.1); padding: 20px; border-radius: 12px;">
                    <h4 style="color: #f5576c; margin-bottom: 15px;">❌ Format Qo'llab-quvvatlanmaydi</h4>
                    <p style="margin-bottom: 15px;">Yuklangan fayl formati hozircha qo'llab-quvvatlanmaydi.</p>
                    <div style="background: rgba(102, 126, 234, 0.1); padding: 15px; border-radius: 8px;">
                        <h5 style="color: #667eea; margin-bottom: 10px;">✅ Qo'llab-quvvatlanadigan formatlar:</h5>
                        <ul style="margin-left: 20px; line-height: 2;">
                            <li>📊 <strong>Spreadsheets:</strong> XLSX, XLS, CSV</li>
                            <li>📘 <strong>Documents:</strong> DOCX, DOC</li>
                            <li>📕 <strong>PDF</strong></li>
                            <li>📝 <strong>Text:</strong> TXT</li>
                            <li>💻 <strong>Code:</strong> JSON, XML, HTML, CSS, JS</li>
                            <li>🖼️ <strong>Images:</strong> PNG, JPG, JPEG, GIF, BMP, WEBP</li>
                        </ul>
                    </div>
                </div>
            `
        };

        return errorResponses[validation.code] || errorResponses['UNSUPPORTED_FORMAT'];
    },

    getFileSizeErrorResponse(sizeMB) {
        return `
            <div style="animation: slideIn 0.5s ease;">
                <h3 style="color: #f5576c; margin-bottom: 20px;">⚠️ Fayl Juda Katta!</h3>
                
                <div style="background: rgba(255, 87, 108, 0.1); padding: 25px; border-radius: 16px; margin-bottom: 20px; border-left: 4px solid #f5576c;">
                    <p style="margin-bottom: 10px;"><strong>Sizning fayl hajmi:</strong> ${sizeMB.toFixed(2)} MB</p>
                    <p><strong>Maksimal ruxsat etilgan:</strong> 50 MB</p>
                </div>

                <div style="background: rgba(255, 210, 0, 0.1); padding: 25px; border-radius: 16px; margin-bottom: 20px;">
                    <h4 style="color: #ffd200; margin-bottom: 15px;">💡 Professional Tavsiyalar</h4>
                    <div style="display: grid; gap: 15px;">
                        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                            <strong>📊 Excel/CSV:</strong>
                            <ul style="margin-left: 20px; margin-top: 8px; line-height: 1.8;">
                                <li>Keraksiz ustunlarni o'chiring</li>
                                <li>Filter qiling va kichik qismlarni eksport qiling</li>
                                <li>CSV formatda saqlang (hajm kamayadi)</li>
                            </ul>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                            <strong>📕 PDF:</strong>
                            <ul style="margin-left: 20px; margin-top: 8px; line-height: 1.8;">
                                <li>PDF compressor ishlatiladi</li>
                                <li>Rasmlar sifatini pasaytiring</li>
                                <li>Keraksiz sahifalarni o'chiring</li>
                            </ul>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                            <strong>🖼️ Rasmlar:</strong>
                            <ul style="margin-left: 20px; margin-top: 8px; line-height: 1.8;">
                                <li>Rasmni compress qiling (TinyPNG)</li>
                                <li>Razmer/resolution ni kamaytiring</li>
                                <li>JPG formatda saqlang (PNG o'rniga)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(79, 172, 254, 0.05); padding: 15px; border-radius: 10px;">
                    <p style="font-size: 14px;">
                        💬 <strong>Yordam kerakmi?</strong><br>
                        <span style="color: var(--gray);">"admin" ga yozing - sizga yordam beramiz!</span>
                    </p>
                </div>
            </div>
        `;
    },

    getFileIcon(type) {
        const icons = {
            'xlsx': '📗', 'xls': '📗', 'csv': '📊',
            'docx': '📘', 'doc': '📘',
            'pdf': '📕',
            'txt': '📝',
            'json': '📋', 'xml': '📋',
            'html': '🌐', 'css': '🎨', 'js': '⚡',
            'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️',
            'bmp': '🖼️', 'webp': '🖼️', 'svg': '🎨',
            'pptx': '📙', 'ppt': '📙',
            'zip': '📦',
            'mp3': '🎵', 'wav': '🎵', 'ogg': '🎵',
            'mp4': '🎬', 'avi': '🎬', 'mkv': '🎬', 'mov': '🎬'
        };
        return icons[type] || '📄';
    },

    getFormatIcon(format) {
        const icons = {
            'pdf': '📕',
            'csv': '📊',
            'xlsx': '📗',
            'txt': '📝',
            'html': '🌐',
            'json': '📋',
            'xml': '📋',
            'docx': '📘',
            'rtf': '📄',
            'png': '🖼️',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'webp': '🌅'
        };
        return icons[format] || '📄';
    },

    updateStats() {
        if ($('fileCount')) $('fileCount').textContent = this.userStats.files;
        if ($('convertCount')) $('convertCount').textContent = this.userStats.converts;
        if ($('msgCount')) $('msgCount').textContent = this.userStats.messages;
    },

    loadUserStats(username) {
        this.userStats = Storage.load(`stats_${username}`, { 
            files: 0, 
            converts: 0, 
            messages: 0 
        });
        this.updateStats();
    },

    saveUserStats() {
        if (Auth.currentUser) {
            Storage.save(`stats_${Auth.currentUser}`, this.userStats);
        }
    }
};

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    Brain.init();
    console.log('🧠 Brain.js v3.0 - ULTIMATE Edition loaded successfully!');
});