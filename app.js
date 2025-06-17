import { captureScreenshot } from './capture.js';
import { addAnnotation, renderAnnotationsOverlay } from './annotations.js';

let currentStream = null;
let currentAnnotations = [];
let currentImageData = null;
let annotationMode = false;
let screenshots = [];
let currentScreenshotIndex = null;

async function startTabShare() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }

    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        currentStream = stream;
        const video = document.getElementById('sharedVideo');
        const img = document.getElementById('screenshot');
        video.srcObject = stream;
        video.style.display = 'block';
        img.style.display = 'none';
        document.getElementById('shareButton').style.display = 'none';
        document.getElementById('cancelButton').style.display = 'inline-block';
        document.getElementById('annotateButton').style.display = 'none';
        document.getElementById('saveAnnotationsButton').style.display = 'none';
        document.getElementById('annotationCanvas').style.display = 'none';
        document.getElementById('annotationInputContainer').style.display = 'none';
        document.getElementById('annotationOverlay').style.display = 'none';
        currentAnnotations = [];
        annotationMode = false;
        currentScreenshotIndex = null;

        video.onloadedmetadata = async () => {
            video.play();
            setTimeout(async () => {
                captureScreenshot(video).then(dataURL => {
                    img.src = dataURL;
                    img.style.display = 'block';
                    video.style.display = 'none';
                    currentImageData = dataURL;
                    setupAnnotationCanvas();
                    stream.getTracks().forEach(track => track.stop());
                    currentStream = null;
                    document.getElementById('annotateButton').style.display = 'inline-block';
                    document.getElementById('saveAnnotationsButton').style.display = 'none';
                    renderAnnotationsOverlay(document.getElementById('annotationOverlay'), img, currentAnnotations);
                });
            }, 300);
        };
    } catch (err) {
        console.error("Error: " + err);
        document.getElementById('shareButton').style.display = 'inline-block';
        document.getElementById('cancelButton').style.display = 'none';
        document.getElementById('annotateButton').style.display = 'none';
        document.getElementById('saveAnnotationsButton').style.display = 'none';
    }
}

function setupAnnotationCanvas() {
    const img = document.getElementById('screenshot');
    const canvas = document.getElementById('annotationCanvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = img.width + 'px';
    canvas.style.height = img.height + 'px';
    canvas.style.display = annotationMode ? 'block' : 'block';
    canvas.style.pointerEvents = annotationMode ? 'auto' : 'none';
    canvas.style.position = 'absolute';
    canvas.style.left = img.offsetLeft + 'px';
    canvas.style.top = img.offsetTop + 'px';
    canvas.style.zIndex = 10;
    drawAnnotations();
    if (annotationMode) {
        canvas.onclick = function (e) {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left);
            const y = (e.clientY - rect.top);
            showAnnotationInput(x, y);
        };
    } else {
        canvas.onclick = null;
    }
}

function showAnnotationInput(x, y) {
    if (!annotationMode) return;
    const container = document.getElementById('annotationInputContainer');
    const img = document.getElementById('screenshot');
    container.style.display = 'block';
    container.style.position = 'absolute';
    container.style.left = (img.offsetLeft + x) + 'px';
    container.style.top = (img.offsetTop + y) + 'px';
    container.style.zIndex = 20;
    container.dataset.x = x / img.width;
    container.dataset.y = y / img.height;
    document.getElementById('annotationText').value = '';
    document.getElementById('annotationText').focus();
}

function confirmAnnotation() {
    if (!annotationMode) return;
    const container = document.getElementById('annotationInputContainer');
    const img = document.getElementById('screenshot');
    const x = parseFloat(container.dataset.x);
    const y = parseFloat(container.dataset.y);
    const text = document.getElementById('annotationText').value;
    if (text.trim() !== '') {
        currentAnnotations = addAnnotation(currentAnnotations, x, y, text);
        drawAnnotations();
        renderAnnotationsOverlay(document.getElementById('annotationOverlay'), img, currentAnnotations);
    }
    container.style.display = 'none';
}

function drawAnnotations() {
    const img = document.getElementById('screenshot');
    const canvas = document.getElementById('annotationCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    currentAnnotations.forEach(a => {
        ctx.font = '16px sans-serif';
        ctx.textBaseline = 'top';
        const padding = 16;
        const metrics = ctx.measureText(a.content);
        const textWidth = metrics.width;
        const textHeight = 20;
        ctx.fillStyle = 'white';
        ctx.fillRect(a.x * img.width, a.y * img.height, textWidth + padding * 2, textHeight + padding * 2);
        ctx.fillStyle = 'black';
        ctx.fillText(a.content, a.x * img.width + padding, a.y * img.height + padding);
    });
}

function enterAnnotationMode() {
    annotationMode = true;
    document.getElementById('annotationCanvas').style.pointerEvents = 'auto';
    document.getElementById('annotationCanvas').style.display = 'block';
    document.getElementById('annotationInputContainer').style.display = 'none';
    document.getElementById('annotateButton').style.display = 'none';
    document.getElementById('saveAnnotationsButton').style.display = 'inline-block';
    document.getElementById('annotationOverlay').style.display = 'none';
    setupAnnotationCanvas();
}

function saveAnnotations() {
    annotationMode = false;
    document.getElementById('annotationCanvas').style.pointerEvents = 'none';
    document.getElementById('annotationInputContainer').style.display = 'none';
    document.getElementById('annotateButton').style.display = 'inline-block';
    document.getElementById('saveAnnotationsButton').style.display = 'none';
    setupAnnotationCanvas();
    renderAnnotationsOverlay(document.getElementById('annotationOverlay'), document.getElementById('screenshot'), currentAnnotations);
}

function cancelScreenshot() {
    const img = document.getElementById('screenshot');
    const canvas = document.getElementById('annotationCanvas');
    if (img.src) {
        screenshots = [{
            image: img.src,
            annotations: [...currentAnnotations]
        }];
        addScreenshotToList(screenshots[0]);
    }
    img.src = '';
    img.style.display = 'none';
    canvas.style.display = 'none';
    document.getElementById('shareButton').style.display = 'inline-block';
    document.getElementById('cancelButton').style.display = 'none';
    document.getElementById('annotateButton').style.display = 'none';
    document.getElementById('saveAnnotationsButton').style.display = 'none';
    document.getElementById('annotationInputContainer').style.display = 'none';
    document.getElementById('annotationOverlay').style.display = 'none';
    currentAnnotations = [];
    annotationMode = false;
    currentScreenshotIndex = null;
}

function addScreenshotToList(screenshotObj) {
    const list = document.getElementById('screenshot-list');
    while (list.firstChild) list.removeChild(list.firstChild);
    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-block';
    wrapper.style.position = 'relative';
    wrapper.style.marginRight = '10px';
    const newImg = document.createElement('img');
    newImg.src = screenshotObj.image;
    newImg.style.maxWidth = '200px';
    newImg.style.cursor = 'pointer';
    newImg.onclick = function () {
        showScreenshotInMain(0);
    };
    if (screenshotObj.annotations && screenshotObj.annotations.length > 0) {
        const badge = document.createElement('div');
        badge.textContent = screenshotObj.annotations.length;
        badge.style.position = 'absolute';
        badge.style.top = '5px';
        badge.style.right = '5px';
        badge.style.background = 'red';
        badge.style.color = 'white';
        badge.style.borderRadius = '50%';
        badge.style.width = '24px';
        badge.style.height = '24px';
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.style.fontWeight = 'bold';
        wrapper.appendChild(badge);
    }
    wrapper.appendChild(newImg);
    list.appendChild(wrapper);
}

function showScreenshotInMain(index) {
    if (screenshots.length === 0) return;
    const img = document.getElementById('screenshot');
    const video = document.getElementById('sharedVideo');
    const canvas = document.getElementById('annotationCanvas');
    const overlay = document.getElementById('annotationOverlay');
    const ss = screenshots[index];
    img.src = ss.image;
    img.style.display = 'block';
    video.style.display = 'none';
    document.getElementById('shareButton').style.display = 'inline-block';
    document.getElementById('cancelButton').style.display = 'inline-block';
    document.getElementById('annotateButton').style.display = 'inline-block';
    document.getElementById('saveAnnotationsButton').style.display = 'none';
    currentAnnotations = ss.annotations ? [...ss.annotations] : [];
    annotationMode = false;
    canvas.style.display = 'none';
    renderAnnotationsOverlay(overlay, img, currentAnnotations);
    currentScreenshotIndex = index;
}

window.startTabShare = startTabShare;
window.cancelScreenshot = cancelScreenshot;
window.showScreenshotInMain = showScreenshotInMain;
window.confirmAnnotation = confirmAnnotation;
window.enterAnnotationMode = enterAnnotationMode;
window.saveAnnotations = saveAnnotations;

export { startTabShare, cancelScreenshot, showScreenshotInMain, confirmAnnotation, enterAnnotationMode, saveAnnotations };