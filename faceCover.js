async function createImageElementWithMaskOnFaceUrl(originalImage, maskUrl) {
    const maskImage = await loadImage(maskUrl);
    return createImageElementWithMaskOnFace(originalImage, maskImage);
}

async function createImageElementWithMaskOnFace(originalImage, maskImage) {
    await loadModels();

    // Create a canvas to draw the image on.
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    canvas.width = originalImage.naturalWidth
    canvas.height = originalImage.naturalHeight
    context.drawImage(originalImage, 0, 0, canvas.width, canvas.height)

    // Detect the face and landmarks.
    const detection = await faceapi
        .detectSingleFace(originalImage, new faceapi.SsdMobilenetv1Options({ scoreThreshold: 0.1 }))
        .withFaceLandmarks(true)

    if (!detection) {
        console.log("No face detected.");
        return
    }
    const overlayValues = getOverlayValues(detection.landmarks)

    const { leftOffset, topOffset, width, angle } = overlayValues;

    rotateContextAtPoint(context, leftOffset + width / 2, topOffset + width / 2, angle);
    context.drawImage(maskImage, leftOffset, topOffset, width, width);
    context.restore();

    // Create another image using the canvas as the source.
    const canvasImage = new Image()
    canvasImage.src = canvas.toDataURL("image/png")

    return canvasImage
}

async function loadModels() {
    if (!faceapi.nets.ssdMobilenetv1.isLoaded || !faceapi.nets.faceLandmark68TinyNet.isLoaded) {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri("models"),
            faceapi.nets.faceLandmark68TinyNet.loadFromUri("models"),
        ]).catch(error => {
            console.error(error)
        })
    }
}

function rotateContextAtPoint(context, x, y, angle) {
    context.save();
    context.translate(x, y);
    context.rotate(angle * Math.PI / 180);
    context.translate(-x, -y);
}

function getOverlayValues(landmarks) {
    const nose = landmarks.getNose()
    const jawline = landmarks.getJawOutline()

    const jawLeft = jawline[0]
    const jawRight = jawline.splice(-1)[0]
    const adjacent = jawRight.x - jawLeft.x
    const opposite = jawRight.y - jawLeft.y
    const jawLength = Math.sqrt(Math.pow(adjacent, 2) + Math.pow(opposite, 2))

    const angle = Math.atan2(opposite, adjacent) * (180 / Math.PI)
    const width = jawLength * 2.2

    return {
        width,
        angle,
        leftOffset: jawLeft.x - width * 0.27,
        topOffset: nose[0].y - width * 0.47,
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        image.src = src;
    });
}
