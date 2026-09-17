import imglyRemoveBackground from 'https://unpkg.com/@imgly/background-removal@1.4.3/dist/index.mjs';

window.AIPhoto = {
    isReady: false,
    isInitializing: false,
    
    init: async function() {
        if (this.isReady || this.isInitializing) return;
        this.isInitializing = true;
        
        try {
            console.log("Loading face-api models...");
            const modelUrl = 'https://unpkg.com/@vladmandic/face-api/model/';
            await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
            await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
            
            this.isReady = true;
            console.log("AI Models loaded successfully");
        } catch (error) {
            console.error("AI Init Error:", error);
            alert("Lỗi tải mô hình AI. Vui lòng kiểm tra kết nối mạng của bạn.");
        } finally {
            this.isInitializing = false;
        }
    },

    processImage: async function(file, options) {
        if (!this.isReady) await this.init();
        
        const img = await this.fileToImage(file);
        let finalImage = img;
        
        if (options.size !== 'keep') {
            console.log("Detecting face...");
            const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
            
            if (detection) {
                console.log("Face detected. Cropping...");
                const box = detection.detection.box;
                const targetRatio = options.size === '3x4' ? (3/4) : (4/6);
                
                const faceHeight = box.height;
                const targetHeight = faceHeight / 0.6; 
                const targetWidth = targetHeight * targetRatio;
                
                const faceCenterX = box.x + box.width / 2;
                const faceCenterY = box.y + box.height / 2;
                
                const cropY = Math.max(0, faceCenterY - targetHeight * 0.45);
                const cropX = Math.max(0, faceCenterX - targetWidth / 2);
                
                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = targetWidth;
                cropCanvas.height = targetHeight;
                const ctx = cropCanvas.getContext('2d');
                
                ctx.fillStyle = options.bg === 'transparent' ? '#ffffff' : options.bg;
                ctx.fillRect(0, 0, targetWidth, targetHeight);
                
                ctx.drawImage(img, cropX, cropY, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
                
                const dataUrl = cropCanvas.toDataURL('image/png');
                finalImage = await this.urlToImage(dataUrl);
            } else {
                console.warn("No face detected! Skipping crop.");
            }
        }
        
        console.log("Removing background...");
        const config = {
            publicPath: 'https://unpkg.com/@imgly/background-removal@1.4.3/dist/'
        };
        
        let transparentBlob;
        try {
            transparentBlob = await imglyRemoveBackground(finalImage.src || finalImage, config);
        } catch (e) {
            console.error("Background removal failed:", e);
            // Fallback to original if background removal fails
            const canvas = document.createElement('canvas');
            canvas.width = finalImage.width;
            canvas.height = finalImage.height;
            canvas.getContext('2d').drawImage(finalImage, 0, 0);
            transparentBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        }
        
        if (options.bg !== 'transparent') {
            console.log("Applying background color...");
            const transparentImg = await this.fileToImage(transparentBlob);
            const canvas = document.createElement('canvas');
            canvas.width = transparentImg.width;
            canvas.height = transparentImg.height;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = options.bg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(transparentImg, 0, 0);
            
            return new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
            });
        }
        
        return transparentBlob;
    },
    
    fileToImage: function(fileOrBlob) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(fileOrBlob);
        });
    },
    
    urlToImage: function(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
};
