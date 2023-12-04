document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d");
    const colorPicker = document.getElementById("color");
    const prePickedColors = document.querySelectorAll(".pre-picked-color");
    const clearCanvasButton = document.getElementById("clearCanvas");
    const saveDrawingButton = document.getElementById("saveDrawing");
    const undoButton = document.getElementById("undo");
    const sprayPaintCheckbox = document.getElementById("sprayPaint");
    const backgroundColorInput = document.getElementById("backgroundColor");
    const sizePreview = document.getElementById("sizePreview");
    const brushSizeInput = document.getElementById("size");
    const drawingCanvas = document.createElement("canvas");
    const drawingCtx = drawingCanvas.getContext("2d");
    const backgroundCanvas = document.createElement("canvas");
    const backgroundCtx = backgroundCanvas.getContext("2d");

    drawingCanvas.width = canvas.width;
    drawingCanvas.height = canvas.height;

    backgroundCanvas.width = canvas.width;
    backgroundCanvas.height = canvas.height;

    let painting = false;
    let lastDrawingTime = Date.now();
    let drawingHistory = []; // Store drawing history for undo

    // Set default background color
    setBackgroundColor(backgroundColorInput.value);

    // Draw the initial state on the canvas
    drawInitialCanvasState();

    function drawInitialCanvasState() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundCanvas, 0, 0);
        ctx.drawImage(drawingCanvas, 0, 0);
    }

    function startPosition(e) {
        painting = true;
        draw(e);
    }

    function endPosition() {
        if (painting) {
            // Save the current state if significant time has passed since the last save
            const currentTime = Date.now();
            if (currentTime - lastDrawingTime > 100) {
                saveDrawingState();
                lastDrawingTime = currentTime;
            }
        }
        painting = false;
        drawingCtx.beginPath();
    }

    function draw(e) {
        if (!painting) return;

        const penSize = brushSizeInput.value;
        const selectedColor = colorPicker.value;

        drawingCtx.lineWidth = penSize;
        drawingCtx.lineCap = "round";
        drawingCtx.strokeStyle = selectedColor;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (sprayPaintCheckbox.checked) {
            sprayPaint(x, y, penSize, selectedColor);
        } else {
            drawingCtx.lineTo(x, y);
            drawingCtx.stroke();
            drawingCtx.beginPath();
            drawingCtx.arc(x, y, penSize / 2, 0, Math.PI * 2); // Draw a circle for the size preview
            drawingCtx.fillStyle = selectedColor;
            drawingCtx.fill();
            drawingCtx.beginPath();
            drawingCtx.moveTo(x, y);
        }

        // Update size preview
        sizePreview.style.width = `${penSize}px`;
        sizePreview.style.height = `${penSize}px`;
        sizePreview.style.backgroundColor = selectedColor;

        // Update the main canvas
        drawInitialCanvasState();
    }

    function sprayPaint(x, y, penSize, selectedColor) {
        drawingCtx.fillStyle = selectedColor;

        for (let i = 0; i < 20; i++) {
            const sprayX = x + Math.random() * penSize * 2 - penSize;
            const sprayY = y + Math.random() * penSize * 2 - penSize;

            drawingCtx.fillRect(sprayX, sprayY, 1, 1);
        }
    }

    function undo() {
        if (drawingHistory.length > 0) {
            drawingCtx.putImageData(drawingHistory.pop(), 0, 0);
            drawInitialCanvasState();
        }
    }

    canvas.addEventListener("mousedown", startPosition);
    canvas.addEventListener("mouseup", endPosition);

    canvas.addEventListener("mousemove", function (e) {
        if (painting) {
            draw(e);
        }
    });

    prePickedColors.forEach((prePickedColor) => {
        prePickedColor.addEventListener("click", function () {
            const color = this.style.backgroundColor;
            colorPicker.value = rgbToHex(color);
            sizePreview.style.backgroundColor = colorPicker.value;
        });
    });

    clearCanvasButton.addEventListener("click", function () {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawingHistory = []; // Clear drawing history
        setBackgroundColor(backgroundColorInput.value, function () {
            drawInitialCanvasState();
        });
    });

    saveDrawingButton.addEventListener("click", function () {
        const dataUrl = drawingCanvas.toDataURL();
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "drawing.png";
        link.click();
    });

    undoButton.addEventListener("click", undo);

    backgroundColorInput.addEventListener("input", function () {
        setBackgroundColor(backgroundColorInput.value, function () {
            drawInitialCanvasState();
        });
    });

    colorPicker.addEventListener("input", function () {
        sizePreview.style.backgroundColor = colorPicker.value;
    });

    brushSizeInput.addEventListener("input", function () {
        const penSize = brushSizeInput.value;
        // Update size preview dynamically
        sizePreview.style.width = `${penSize}px`;
        sizePreview.style.height = `${penSize}px`;
    });

    function setBackgroundColor(color, callback) {
        backgroundCtx.fillStyle = color;
        backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

        // Load the drawing canvas image
        const img = new Image();
        img.onload = function () {
            drawingCtx.drawImage(img, 0, 0);
            if (typeof callback === "function") {
                callback();
            }
        };
        img.src = drawingCanvas.toDataURL();
    }

    function rgbToHex(rgb) {
        const values = rgb.match(/\d+/g);
        const hex = values.map(value => Number(value).toString(16).padStart(2, '0')).join('');
        return `#${hex}`;
    }

    function saveDrawingState() {
        // Save the current state for undo
        drawingHistory.push(drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height));
    }
});
