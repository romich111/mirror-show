/**
 * MIRROR SHOW - Premium Mirror Web App
 * A luxury self-love mirror app with beauty effects
 * ENHANCED: User-friendly, error handling, accessibility
 * COMPATIBLE: Works on all modern browsers
 */

// ============================================
// Browser Compatibility & Polyfills
// ============================================

// Get the correct getUserMedia function for this browser
const getUserMediaFunction = 
    navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ||
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

// Modern Promise-based wrapper
function getCamera(constraints) {
    // If native mediaDevices exists, use it
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
    }
    
    // Fallback for older browsers
    if (getUserMediaFunction) {
        return new Promise((resolve, reject) => {
            getUserMediaFunction(constraints, resolve, reject);
        });
    }
    
    return Promise.reject(new Error('Camera API not supported on this browser'));
}

// Request Animation Frame polyfill
window.requestAnimationFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function(callback) {
        return setTimeout(callback, 1000 / 60);
    };

// ============================================
// Global State & Configuration
// ============================================

const state = {
    cameraActive: false,
    beautyModeOn: true,
    ringLightOn: false,
    autoRingLightOn: true,
    softLightMode: true,
    facingMode: 'user',
    stream: null,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    facesDetected: 0,
    lastComplimentTime: 0,
    browserSupported: true,
    cameraAvailable: true,
    isOnline: navigator.onLine,
    brightness: 100,
    lastBrightness: 100,
    frameSkip: state?.isMobile ? 2 : 1,
};

const compliments = [
    "You look beautiful 💖",
    "Glowing like a star ✨",
    "So pretty right now 🌸",
    "Your smile is adorable 💕",
    "Self-love mode activated 💫",
    "You shine brighter than diamonds ✨",
    "Absolutely radiant today 🌟",
    "Such a gorgeous glow 💖",
    "You're a work of art 🎨",
    "Inner beauty shining through ✨",
    "Flawless and fabulous 💅",
    "You're magical 🦄",
    "Pure elegance right here 👑",
    "Beauty on fleek 💯",
    "Your confidence is beautiful 💖",
];

// ============================================
// DOM Elements
// ============================================

const startScreen = document.getElementById('startScreen');
const mirrorScreen = document.getElementById('mirrorScreen');
const permissionScreen = document.getElementById('permissionScreen');
const browserScreen = document.getElementById('browserScreen');
const noCameraScreen = document.getElementById('noCameraScreen');

const startBtn = document.getElementById('startBtn');
const permissionBtn = document.getElementById('permissionBtn');
const permissionBackBtn = document.getElementById('permissionBackBtn');
const browserBackBtn = document.getElementById('browserBackBtn');
const noCameraBackBtn = document.getElementById('noCameraBackBtn');

const videoFeed = document.getElementById('videoFeed');
const effectCanvas = document.getElementById('effectCanvas');
const ctx = effectCanvas ? effectCanvas.getContext('2d', { willReadFrequently: true }) : null;

const captureBtn = document.getElementById('captureBtn');
const beautyBtn = document.getElementById('beautyBtn');
const autoRingLightBtn = document.getElementById('autoRingLightBtn');
const ringLightBtn = document.getElementById('ringLightBtn');
const softLightBtn = document.getElementById('softLightBtn');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const closeBtn = document.getElementById('closeBtn');

const ringLight = document.getElementById('ringLight');
const faceGlow = document.getElementById('faceGlow');
const complimentText = document.getElementById('complimentText');
const ringLightStatus = document.getElementById('ringLightStatus');
const beautyModeStatus = document.getElementById('beautyModeStatus');
const loadingIndicator = document.getElementById('loadingIndicator');
const sparklesContainer = document.getElementById('sparklesContainer');
const offlineNotification = document.getElementById('offlineNotification');
const updateNotification = document.getElementById('updateNotification');
const updateBtn = document.getElementById('updateBtn');

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Setup network listeners
    setupNetworkListeners();
    
    // Setup service worker updates
    setupServiceWorkerUpdates();

    // Event Listeners
    startBtn.addEventListener('click', handleStartClick);
    permissionBtn.addEventListener('click', startCamera);
    permissionBackBtn.addEventListener('click', goBackToStart);
    browserBackBtn.addEventListener('click', goBackToStart);
    noCameraBackBtn.addEventListener('click', goBackToStart);
    
    captureBtn.addEventListener('click', capturePhoto);
    beautyBtn.addEventListener('click', toggleBeautyMode);
    autoRingLightBtn.addEventListener('click', toggleAutoRingLight);
    ringLightBtn.addEventListener('click', toggleRingLight);
    softLightBtn.addEventListener('click', toggleSoftLight);
    switchCameraBtn.addEventListener('click', switchCamera);
    closeBtn.addEventListener('click', closeMirror);

    updateBtn.addEventListener('click', () => {
        window.location.reload();
    });

    videoFeed.addEventListener('loadedmetadata', setupCanvas);
    window.addEventListener('resize', setupCanvas);

    // Accessibility
    setupAccessibility();
    
    // Prevent unwanted interactions on start screen
    preventBodyScroll();
    
    // Show help on first visit
    showFirstTimeHelp();
}

// ============================================
// Browser Support Check (KEPT FOR FUTURE USE)
// ============================================

// This is now disabled - just try to use camera directly
function checkBrowserSupport() {
    // Support detection moved to runtime error handling
}

function checkCameraAvailable() {
    // Try to enumerate devices
    if (!navigator.mediaDevices.enumerateDevices) {
        // If enumeration not available, assume camera exists (optimistic approach)
        return Promise.resolve(true);
    }

    return navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const hasCamera = devices.some(device => device.kind === 'videoinput');
            state.cameraAvailable = hasCamera || devices.length === 0; // Assume yes if empty
            return state.cameraAvailable;
        })
        .catch(error => {
            // If enumeration fails, assume camera available (try anyway)
            console.warn('Camera enumeration failed, assuming available:', error);
            state.cameraAvailable = true;
            return true;
        });
}

// ============================================
// Network Status
// ============================================

function setupNetworkListeners() {
    window.addEventListener('online', () => {
        state.isOnline = true;
        offlineNotification.classList.add('hidden');
    });

    window.addEventListener('offline', () => {
        state.isOnline = false;
        offlineNotification.classList.remove('hidden');
    });

    // Initial check
    if (!navigator.onLine) {
        offlineNotification.classList.remove('hidden');
    }
}

// ============================================
// Service Worker Updates
// ============================================

function setupServiceWorkerUpdates() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        updateNotification.classList.remove('hidden');
    });

    // Check for updates periodically
    setInterval(() => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
        }
    }, 3600000); // Every hour
}

// ============================================
// Accessibility Setup
// ============================================

function setupAccessibility() {
    // Add ARIA labels
    startBtn.setAttribute('aria-label', 'Begin mirror experience');
    permissionBtn.setAttribute('aria-label', 'Grant camera permission');
    captureBtn.setAttribute('aria-label', 'Capture photo');
    closeBtn.setAttribute('aria-label', 'Close mirror');

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (state.cameraActive) {
            if (e.key === 'Enter' || e.key === ' ') captureBtn.click();
            if (e.key === 'Escape') closeBtn.click();
            if (e.key === 'b' || e.key === 'B') beautyBtn.click();
            if (e.key === 'l' || e.key === 'L') ringLightBtn.click();
        }
    });
}

// ============================================
// Screen Navigation
// ============================================

function showScreen(screenElement) {
    // Hide all screens
    startScreen.classList.remove('active');
    mirrorScreen.classList.remove('active');
    permissionScreen.classList.remove('active');
    browserScreen.classList.remove('active');
    noCameraScreen.classList.remove('active');
    
    // Show target screen
    if (screenElement) {
        screenElement.classList.add('active');
    }
}

function goBackToStart() {
    closeMirror();
    showScreen(startScreen);
}

function preventBodyScroll() {
    document.body.style.overflow = 'hidden';
}

function handleStartClick() {
    requestCameraPermission();
}

// ============================================
// Camera & Permission Management
// ============================================

function requestCameraPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showScreen(browserScreen);
        return;
    }

    showScreen(permissionScreen);
}

async function startCamera() {
    try {
        showScreen(mirrorScreen);
        loadingIndicator.classList.remove('hidden');
        
        // Get camera stream with proper constraints
        const constraints = {
            video: {
                facingMode: state.facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        // Add timeout for permission request
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Camera permission timeout')), 10000)
        );

        // Use the getCamera function that works on all browsers
        state.stream = await Promise.race([getCamera(constraints), timeoutPromise]);
        videoFeed.srcObject = state.stream;
        state.cameraActive = true;

        // Add error handling for stream
        state.stream.addEventListener('inactive', () => {
            console.log('Camera stream ended');
            closeMirror();
        });

        // Start mirror effects after stream loads
        videoFeed.onloadedmetadata = () => {
            setupCanvas();
            startMirrorEffects();
            loadingIndicator.classList.add('hidden');
            showFirstTimeMirrorHelp();
        };

    } catch (error) {
        handleCameraError(error);
    }
}

function handleCameraError(error) {
    console.error('Camera error:', error);
    loadingIndicator.classList.add('hidden');
    
    let message = 'Could not access camera:\n\n';
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        message += '📵 Camera permission denied.\n\nPlease:\n1. Check phone settings\n2. Grant camera permission\n3. Try again';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        message += '📹 No camera found on this device.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        message += '🔒 Camera is in use by another app.\n\nClose other apps and try again.';
    } else {
        message += error.message || 'Check camera permission and try again.';
    }
    
    alert(message);
    showScreen(startScreen);
}

function setupCanvas() {
    if (!effectCanvas || !videoFeed.videoWidth) return;

    effectCanvas.width = videoFeed.videoWidth;
    effectCanvas.height = videoFeed.videoHeight;
}

function closeMirror() {
    state.cameraActive = false;
    
    // Properly clean up all video tracks
    if (state.stream) {
        state.stream.getTracks().forEach(track => {
            track.stop();
        });
        state.stream = null;
    }

    videoFeed.srcObject = null;
    
    // Clean up canvas
    if (ctx) {
        ctx.clearRect(0, 0, effectCanvas.width, effectCanvas.height);
    }
    
    // Reset UI and clean up effects
    beautyBtn.classList.add('active');
    autoRingLightBtn.classList.add('active');
    ringLightBtn.classList.remove('active');
    softLightBtn.classList.add('active');
    ringLight.classList.remove('active');
    faceGlow.classList.remove('active');
    beautyModeStatus.classList.remove('off');
    state.beautyModeOn = true;
    state.ringLightOn = false;
    state.autoRingLightOn = true;
    state.softLightMode = true;
    
    showScreen(startScreen);
}

async function switchCamera() {
    if (!state.cameraActive) return;

    try {
        // Stop current stream safely
        if (state.stream) {
            state.stream.getTracks().forEach(track => track.stop());
        }
        
        // Switch facing mode
        state.facingMode = state.facingMode === 'user' ? 'environment' : 'user';
        
        loadingIndicator.classList.remove('hidden');
        
        // Restart camera with new facing mode
        const constraints = {
            video: {
                facingMode: state.facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        // Add timeout for camera switch
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Camera switch timeout')), 10000)
        );

        state.stream = await Promise.race([getCamera(constraints), timeoutPromise]);
        videoFeed.srcObject = state.stream;
        
        setTimeout(() => {
            loadingIndicator.classList.add('hidden');
        }, 500);
    } catch (error) {
        console.error('Switch camera error:', error);
        loadingIndicator.classList.add('hidden');
        // Revert to previous facing mode
        state.facingMode = state.facingMode === 'user' ? 'environment' : 'user';
        alert('Could not switch camera. Your device may not support this.');
    }
}

// ============================================
// Mirror Effects & Animations
// ============================================

function startMirrorEffects() {
    let frameCount = 0;

    function processFrame() {
        if (!state.cameraActive) return;

        try {
            frameCount++;

            // On mobile, skip most processing - use CSS filters instead
            if (state.isMobile) {
                // Only do brightness detection on mobile (skip face detection too)
                if (frameCount % 60 === 0 && state.autoRingLightOn) {
                    detectDarknessAndApplyRingLight();
                }
                
                // Add sparkles occasionally
                if (frameCount % 120 === 0 && Math.random() > 0.8) {
                    createSparkle();
                }
            } else {
                // Desktop: apply all effects
                if (state.beautyModeOn) {
                    applyBeautyEffects();
                }

                if (state.autoRingLightOn) {
                    detectDarknessAndApplyRingLight();
                }

                if (frameCount % 30 === 0) {
                    detectFaceAndShowCompliment();
                }

                if (frameCount % 100 === 0 && Math.random() > 0.7) {
                    createSparkle();
                }
            }
        } catch (error) {
            console.error('Frame processing error:', error);
        }

        requestAnimationFrame(processFrame);
    }

    processFrame();
}

function applyBeautyEffects() {
    if (!ctx || !videoFeed.videoWidth) return;

    try {
        const width = effectCanvas.width;
        const height = effectCanvas.height;

        // Draw video once with all filters applied
        ctx.filter = `blur(1px) brightness(1.1) contrast(1.08) saturate(0.95)`;
        ctx.drawImage(videoFeed, 0, 0, width, height);
        ctx.filter = 'none';

        // Minimal overlay - lighter computation
        const glowGradient = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, Math.max(width, height));
        glowGradient.addColorStop(0, 'rgba(255, 220, 120, 0.05)');
        glowGradient.addColorStop(1, 'rgba(255, 150, 100, 0)');
        
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;

    } catch (error) {
        console.error('Beauty effects error:', error);
    }
}

function detectDarknessAndApplyRingLight() {
    if (!ctx || !videoFeed.videoWidth) return;

    try {
        const width = effectCanvas.width;
        const height = effectCanvas.height;

        // Get image data ONCE and sample efficiently
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Sample every 16th pixel for blazing fast detection
        let brightness = 0;
        let samples = 0;
        
        for (let i = 0; i < data.length; i += 64) { // Every 16th pixel
            brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
            samples++;
        }
        brightness = brightness / samples;

        // Smooth transitions
        state.lastBrightness = state.brightness;
        state.brightness = (brightness * 0.7 + state.brightness * 0.3); // Smoother blend

        // Simple hysteresis: avoid flickering
        if (state.brightness < 70 && !state.ringLightOn && state.autoRingLightOn) {
            enableRingLight();
        } else if (state.brightness > 115 && state.ringLightOn && state.autoRingLightOn) {
            disableRingLight();
        }

        // Apply single brightness boost if ring light is on
        if (state.ringLightOn) {
            ctx.filter = 'brightness(1.2)';
            ctx.globalAlpha = 0.4;
            ctx.drawImage(videoFeed, 0, 0, width, height);
            ctx.globalAlpha = 1;
            ctx.filter = 'none';
        }
    } catch (error) {
        console.error('Ring light detection error:', error);
    }
}

function enableRingLight() {
    state.ringLightOn = true;
    ringLight.classList.add('active');
    ringLightBtn.classList.add('active');
    
    // Show ring light activated message
    ringLightStatus.style.animation = 'slideInDown 0.5s ease, slideOutUp 0.5s ease 3.5s forwards';
    setTimeout(() => {
        ringLightStatus.style.animation = 'none';
    }, 4000);
}

function disableRingLight() {
    state.ringLightOn = false;
    ringLight.classList.remove('active');
    ringLightBtn.classList.remove('active');
}

function toggleRingLight() {
    if (state.ringLightOn) {
        disableRingLight();
    } else {
        enableRingLight();
    }
}

function toggleBeautyMode() {
    state.beautyModeOn = !state.beautyModeOn;
    beautyBtn.classList.toggle('active');
    
    if (state.beautyModeOn) {
        beautyModeStatus.classList.remove('off');
        beautyModeStatus.textContent = 'Beauty Mode: ON';
    } else {
        beautyModeStatus.classList.add('off');
        beautyModeStatus.textContent = 'Beauty Mode: OFF';
    }
}

function toggleAutoRingLight() {
    state.autoRingLightOn = !state.autoRingLightOn;
    autoRingLightBtn.classList.toggle('active');
    
    if (!state.autoRingLightOn && state.ringLightOn) {
        disableRingLight();
    }
}

function toggleSoftLight() {
    state.softLightMode = !state.softLightMode;
    softLightBtn.classList.toggle('active');
}

// ============================================
// Face Detection & Compliments
// ============================================

function detectFaceAndShowCompliment() {
    if (!ctx || !effectCanvas.width) return;

    try {
        // Simple motion/face detection based on pixel changes
        const imageData = ctx.getImageData(0, 0, effectCanvas.width, effectCanvas.height);
        const data = imageData.data;

        // Count pixels in center area (likely face region)
        const centerX = effectCanvas.width / 2;
        const centerY = effectCanvas.height / 2;
        const radius = Math.min(effectCanvas.width, effectCanvas.height) / 3;

        let facePixels = 0;
        for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4;
            const x = pixelIndex % effectCanvas.width;
            const y = Math.floor(pixelIndex / effectCanvas.width);

            const dx = x - centerX;
            const dy = y - centerY;

            if (dx * dx + dy * dy < radius * radius) {
                // Check if pixel has reasonable color (skin tone range)
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                if (r > 40 && g > 40 && b > 40 && r > b) {
                    facePixels++;
                }
            }
        }

        // If enough face pixels detected, show compliment
        if (facePixels > 1000) {
            const now = Date.now();
            if (now - state.lastComplimentTime > 6000) {
                showCompliment();
                state.lastComplimentTime = now;
                state.facesDetected++;

                // Activate face glow
                activateFaceGlow();
            }
        }
    } catch (error) {
        console.error('Face detection error:', error);
    }
}

function showCompliment() {
    const compliment = compliments[Math.floor(Math.random() * compliments.length)];
    complimentText.textContent = compliment;
    complimentText.classList.remove('show');
    
    // Trigger animation
    setTimeout(() => {
        complimentText.classList.add('show');
    }, 10);
}

function activateFaceGlow() {
    // Clear any previous timeouts
    if (window.faceGlowTimeout) {
        clearTimeout(window.faceGlowTimeout);
    }

    faceGlow.classList.add('active');
    faceGlow.style.width = '300px';
    faceGlow.style.height = '300px';

    window.faceGlowTimeout = setTimeout(() => {
        faceGlow.classList.remove('active');
        faceGlow.style.width = '0';
        faceGlow.style.height = '0';
        window.faceGlowTimeout = null;
    }, 2000);
}

// ============================================
// Photo Capture
// ============================================

function capturePhoto() {
    try {
        // Create temporary canvas for capture
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = videoFeed.videoWidth;
        captureCanvas.height = videoFeed.videoHeight;
        const captureCtx = captureCanvas.getContext('2d');

        // Mirror the image (scaleX(-1))
        captureCtx.scale(-1, 1);
        captureCtx.drawImage(videoFeed, -captureCanvas.width, 0);

        // Apply beauty effects to captured image
        if (state.beautyModeOn) {
            const imageData = captureCtx.getImageData(0, 0, captureCanvas.width, captureCanvas.height);
            captureCtx.putImageData(imageData, 0, 0);

            captureCtx.filter = 'brightness(1.15) contrast(1.1)';
            captureCtx.globalAlpha = 0.5;
            captureCtx.drawImage(captureCanvas, 0, 0);
            captureCtx.globalAlpha = 1;
            captureCtx.filter = 'none';
        }

        // Show flash animation
        showFlash();

        // Convert canvas to blob and download
        captureCanvas.toBlob(blob => {
            downloadPhoto(blob);
        }, 'image/jpeg', 0.95);
    } catch (error) {
        console.error('Capture error:', error);
        alert('Could not capture photo. Please try again.');
    }
}

function showFlash() {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        opacity: 0.8;
        z-index: 999;
        pointer-events: none;
        animation: flashFade 0.6s ease-out;
    `;

    document.body.appendChild(flash);

    const style = document.createElement('style');
    style.textContent = `
        @keyframes flashFade {
            0% { opacity: 0.8; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => flash.remove(), 600);
    
    // Play shutter sound
    playShutterSound();
}

function downloadPhoto(blob) {
    try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mirror-show-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download error:', error);
        alert('Could not save photo. Please try again or check your storage.');
    }
}

function playShutterSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.log('Audio not available');
    }
}

// ============================================
// Visual Effects - Sparkles
// ============================================

function createSparkle() {
    try {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.textContent = ['✨', '💫', '⭐', '🌟'][Math.floor(Math.random() * 4)];

        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;

        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';

        // Random animation direction
        const tx = (Math.random() - 0.5) * 100;
        const ty = (Math.random() - 0.5) * 100 - 50;

        sparkle.style.setProperty('--tx', tx + 'px');
        sparkle.style.setProperty('--ty', ty + 'px');
        sparkle.style.animation = `sparkleFloat ${1 + Math.random() * 1}s ease-out forwards`;

        sparklesContainer.appendChild(sparkle);

        setTimeout(() => sparkle.remove(), 2000);
    } catch (error) {
        console.error('Sparkle creation error:', error);
    }
}

// ============================================
// First-Time User Help
// ============================================

function showFirstTimeHelp() {
    const hasVisited = localStorage.getItem('mirror-show-visited');
    
    if (!hasVisited) {
        localStorage.setItem('mirror-show-visited', 'true');
        
        // You can add a tutorial or help message here
        console.log('First time visitor - Consider showing tutorial');
    }
}

function showFirstTimeMirrorHelp() {
    // Optional: Show brief help on first mirror use
    // Can add a tooltip or help screen here
}

// ============================================
// Error Boundaries
// ============================================

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Safely close camera if there's a critical error
    if (state.cameraActive && event.error) {
        try {
            closeMirror();
        } catch (e) {
            console.error('Error during emergency close:', e);
        }
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Prevent white screen on unhandled promise rejection
    event.preventDefault();
});

// Handle page unload cleanup
window.addEventListener('beforeunload', () => {
    if (state.cameraActive && state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
    }
});

// ============================================
// Initialize Service Worker
// ============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').then(registration => {
            console.log('Service Worker registered:', registration);
        }).catch(error => {
            console.log('Service Worker registration failed:', error);
        });
    });
}

// ============================================
// Performance Optimization
// ============================================

// Handle visibility change to optimize performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.cameraActive) {
        state.stream.getTracks().forEach(track => {
            track.enabled = false;
        });
    } else if (!document.hidden && state.cameraActive) {
        state.stream.getTracks().forEach(track => {
            track.enabled = true;
        });
    }
});

// Prevent screen orientation lock issues
window.addEventListener('orientationchange', () => {
    setTimeout(setupCanvas, 100);
});

