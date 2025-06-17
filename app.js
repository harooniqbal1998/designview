let currentStream = null;

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

                // Stop the stream
                stream.getTracks().forEach(track => track.stop());
                currentStream = null;
            }, 300);
        };
    } catch (err) {
        console.error("Error: " + err);
        document.getElementById('shareButton').style.display = 'inline-block';
        document.getElementById('cancelButton').style.display = 'none';
    }
}

function cancelScreenshot() {
    const img = document.getElementById('screenshot');
    if (img.src) {
        // Move the image to the screenshot-list
        const list = document.getElementById('screenshot-list');
        const newImg = document.createElement('img');
        newImg.src = img.src;
        newImg.style.maxWidth = '200px';
        newImg.style.marginRight = '10px';
        newImg.style.cursor = 'pointer';
        newImg.onclick = function () {
            showScreenshotInMain(newImg.src);
        };
        list.appendChild(newImg);
    }
    img.src = '';
    img.style.display = 'none';
    document.getElementById('shareButton').style.display = 'inline-block';
    document.getElementById('cancelButton').style.display = 'none';
}

function showScreenshotInMain(src) {
    const img = document.getElementById('screenshot');
    const video = document.getElementById('sharedVideo');
    img.src = src;
    img.style.display = 'block';
    video.style.display = 'none';
    document.getElementById('shareButton').style.display = 'inline-block';
    document.getElementById('cancelButton').style.display = 'inline-block';
}

window.startTabShare = startTabShare;
window.cancelScreenshot = cancelScreenshot;
window.showScreenshotInMain = showScreenshotInMain;