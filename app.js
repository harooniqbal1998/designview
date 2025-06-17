let currentStream = null;
let annotations = [];
let currentImageData = null;
let annotationMode = false;

async function startTabShare() {
    // Stop previous stream if it exists
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }

    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true
        });
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
        annotations = [];
        annotationMode = false;

        // Wait for the video to be ready
        video.onloadedmetadata = async () => {
            video.play();
            setTimeout(() => {
                // Create a canvas and draw the current frame
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Convert to base64
                const dataURL = canvas.toDataURL('image/png');
                img.src = dataURL;
                img.style.display = 'block';
                video.style.display = 'none';
                currentImageData = dataURL;
                setupAnnotationCanvas();

                // Stop the stream
                stream.getTracks().forEach(track => track.stop());
                currentStream = null;

                // Show Annotate button in preview mode
                document.getElementById('annotateButton').style.display = 'inline-block';
                document.getElementById('saveAnnotationsButton').style.display = 'none';
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
    // Use displayed size for canvas overlay
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = img.width + 'px';
    canvas.style.height = img.height + 'px';
    canvas.style.display = annotationMode ? 'block' : 'block'; // always show for drawing, but pointer events only in annotation mode
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
    // Store normalized coordinates for annotation
    container.dataset.x = x / img.width;
    container.dataset.y = y / img.height;
    document.getElementById('annotationText').value = '';
    document.getElementById('annotationText').focus();
}

function confirmAnnotation() {
    if (!annotationMode) return;
    const container = document.getElementById('annotationInputContainer');
    const img = document.getElementById('screenshot');
    // Convert normalized coordinates back to displayed coordinates
    const x = parseFloat(container.dataset.x) * img.width;
    const y = parseFloat(container.dataset.y) * img.height;
    const text = document.getElementById('annotationText').value;
    if (text.trim() !== '') {
        annotations.push({ x, y, text });
        drawAnnotations();
    }
    container.style.display = 'none';
}

function drawAnnotations() {
    const img = document.getElementById('screenshot');
    const canvas = document.getElementById('annotationCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    annotations.forEach(a => {
        ctx.font = '16px sans-serif';
        ctx.textBaseline = 'top';
        const padding = 16;
        const metrics = ctx.measureText(a.text);
        const textWidth = metrics.width;
        const textHeight = 20;
        ctx.fillStyle = 'white';
        ctx.fillRect(a.x, a.y, textWidth + padding * 2, textHeight + padding * 2);
        ctx.fillStyle = 'black';
        ctx.fillText(a.text, a.x + padding, a.y + padding);
    });
}

function enterAnnotationMode() {
    annotationMode = true;
    document.getElementById('annotationCanvas').style.pointerEvents = 'auto';
    document.getElementById('annotationCanvas').style.display = 'block';
    document.getElementById('annotationInputContainer').style.display = 'none';
    document.getElementById('annotateButton').style.display = 'none';
    document.getElementById('saveAnnotationsButton').style.display = 'inline-block';
    setupAnnotationCanvas();
}

function saveAnnotations() {
    annotationMode = false;
    document.getElementById('annotationCanvas').style.pointerEvents = 'none';
    document.getElementById('annotationInputContainer').style.display = 'none';
    document.getElementById('annotateButton').style.display = 'inline-block';
    document.getElementById('saveAnnotationsButton').style.display = 'none';
    setupAnnotationCanvas();
}

function cancelScreenshot() {
    const img = document.getElementById('screenshot');
    const canvas = document.getElementById('annotationCanvas');
    if (img.src) {
        // Draw annotations onto a new canvas and save as image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.naturalWidth;
        tempCanvas.height = img.naturalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        const tempImg = new window.Image();
        tempImg.onload = function () {
            tempCtx.drawImage(tempImg, 0, 0);
            // Draw annotations
            annotations.forEach(a => {
                tempCtx.font = '16px sans-serif';
                tempCtx.textBaseline = 'top';
                const padding = 16;
                const metrics = tempCtx.measureText(a.text);
                const textWidth = metrics.width;
                const textHeight = 20;
                tempCtx.fillStyle = 'white';
                tempCtx.fillRect(a.x, a.y, textWidth + padding * 2, textHeight + padding * 2);
                tempCtx.fillStyle = 'black';
                tempCtx.fillText(a.text, a.x + padding, a.y + padding);
            });
            const annotatedDataURL = tempCanvas.toDataURL('image/png');
            addScreenshotToList(annotatedDataURL, annotations.length);
        };
        tempImg.src = img.src;
    }
    img.src = '';
    img.style.display = 'none';
    canvas.style.display = 'none';
    document.getElementById('shareButton').style.display = 'inline-block';
    document.getElementById('cancelButton').style.display = 'none';
    document.getElementById('annotateButton').style.display = 'none';
    document.getElementById('saveAnnotationsButton').style.display = 'none';
    document.getElementById('annotationInputContainer').style.display = 'none';
    annotations = [];
    annotationMode = false;
}

function addScreenshotToList(dataURL, annotationCount) {
    const list = document.getElementById('screenshot-list');
    // Remove previous image if it exists (overwrite)
    while (list.firstChild) list.removeChild(list.firstChild);
    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-block';
    wrapper.style.position = 'relative';
    wrapper.style.marginRight = '10px';
    const newImg = document.createElement('img');
    newImg.src = dataURL;
    newImg.style.maxWidth = '200px';
    newImg.style.cursor = 'pointer';
    newImg.onclick = function () {
        showScreenshotInMain(newImg.src);
    };
    // Badge
    if (annotationCount > 0) {
        const badge = document.createElement('div');
        badge.textContent = annotationCount;
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

function showScreenshotInMain(src) {
    const img = document.getElementById('screenshot');
    const video = document.getElementById('sharedVideo');
    const canvas = document.getElementById('annotationCanvas');
    img.src = src;
    img.style.display = 'block';
    video.style.display = 'none';
    document.getElementById('shareButton').style.display = 'inline-block';
    document.getElementById('cancelButton').style.display = 'inline-block';
    document.getElementById('annotateButton').style.display = 'inline-block';
    document.getElementById('saveAnnotationsButton').style.display = 'none';
    annotations = [];
    annotationMode = false;
    canvas.style.display = 'none';
}

window.startTabShare = startTabShare;
window.cancelScreenshot = cancelScreenshot;
window.showScreenshotInMain = showScreenshotInMain;
window.confirmAnnotation = confirmAnnotation;
window.enterAnnotationMode = enterAnnotationMode;
window.saveAnnotations = saveAnnotations;