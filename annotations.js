// annotations.js

export function addAnnotation(annotations, x, y, content) {
    return [...annotations, { x, y, content }];
}

export function renderAnnotationsOverlay(overlayElement, imgElement, annotations) {
    overlayElement.innerHTML = '';
    if (!imgElement.src || annotations.length === 0) {
        overlayElement.style.display = 'none';
        return;
    }
    overlayElement.style.display = 'block';
    overlayElement.style.width = imgElement.width + 'px';
    overlayElement.style.height = imgElement.height + 'px';
    overlayElement.style.left = imgElement.offsetLeft + 'px';
    overlayElement.style.top = imgElement.offsetTop + 'px';
    overlayElement.style.position = 'absolute';
    overlayElement.style.pointerEvents = 'none';
    annotations.forEach(a => {
        const div = document.createElement('div');
        div.textContent = a.content;
        div.style.position = 'absolute';
        div.style.left = (a.x * imgElement.width) + 'px';
        div.style.top = (a.y * imgElement.height) + 'px';
        div.style.background = 'white';
        div.style.padding = '16px';
        div.style.borderRadius = '4px';
        div.style.fontSize = '16px';
        div.style.color = 'black';
        div.style.pointerEvents = 'none';
        overlayElement.appendChild(div);
    });
} 