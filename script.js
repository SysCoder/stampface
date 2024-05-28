document.getElementById('uploadImageButton').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('myImg').src = e.target.result;
            generateImageWithStamp();
        }
        reader.readAsDataURL(file);
    }
});

document.getElementById('uploadStampButton').addEventListener('click', function() {
    document.getElementById('fileStampInput').click();
});

function downloadImage() {
    const img = document.getElementById('myImg');
    const link = document.createElement('a');
    link.href = img.src;
    link.download = 'faceCoveredImage.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateImageWithStamp() {
    (async () => {
        console.log("Generating image with stamp.");
        const button = document.getElementById("faceCoverButton");
        button.disabled = true;
        button.innerText = "Cover Face";
        document.getElementById("downloadImageButton").disabled = true;

        // load face-api.js
        const originalImage = document.getElementById("myImg");
        let maskImage = await loadImage("smillingEmoji.png");

        // Check if fileStampInput has a file
        const fileStampInput = document.getElementById('fileStampInput');
        if (fileStampInput.files.length > 0) {
            const file = fileStampInput.files[0];
            const reader = new FileReader();
            async function loadMaskImage(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const maskImage = new Image();
                        maskImage.onload = function() {
                            resolve(maskImage);
                        };
                        maskImage.onerror = function() {
                            reject(new Error('Failed to load mask image.'));
                        };
                        maskImage.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            }
            maskImage = await loadMaskImage(file);
        }


        const newImage = await createImageElementWithMaskOnFace(originalImage, maskImage);
        console.log("Generated image with stamp.");
        newImage.id = "otherImage";
        // Save the new image for later use.
        if (document.getElementById("hiddenContainer").children.length > 0) {
            document.getElementById("hiddenContainer").removeChild(document.getElementById("hiddenContainer").children[0]);
        }
        document.getElementById("hiddenContainer").appendChild(newImage);
        document.getElementById("faceCoverButton").disabled = false;
    })();
}

async function coverFace() {
    const currentImage = document.getElementById("myImg");
    const otherImage = document.getElementById("otherImage");
    const temp = currentImage.src;
    currentImage.src = otherImage.src;
    otherImage.src = temp;

    const button = document.getElementById("faceCoverButton");
    const downloadButton = document.getElementById("downloadImageButton");
    if (button.innerText === "Cover Face") {
        button.innerText = "Uncover Face";
        document.getElementById("faceCoverButton").disabled = false;
        downloadButton.disabled = false;
    } else {
        button.innerText = "Cover Face";
        downloadButton.disabled = true;
    }
}