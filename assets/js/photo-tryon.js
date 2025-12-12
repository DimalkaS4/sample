/**
 * DianEro - User Photo Virtual Try-On
 * Handles uploading a user photo and manually overlaying the t-shirt image.
 */

window.initPhotoTryOn = function () {
    const fileInput = document.getElementById('userPhotoInput');
    const clearBtn = document.getElementById('clearPhotoBtn');
    const canvas = document.getElementById('userTryOnCanvas');
    const ctx = canvas.getContext('2d');

    // Controls
    const infoStatus = document.getElementById('tryOnStatus');
    const scaleInput = document.getElementById('tryOnScale');
    const rotateInput = document.getElementById('tryOnRotate');

    // State
    let userImage = null;
    let shirtImage = null;
    let state = {
        x: 0,
        y: 0,
        scale: 1.0,
        rotation: 0,
        isDragging: false,
        lastX: 0,
        lastY: 0
    };

    // Event Listeners
    if (fileInput) fileInput.addEventListener('change', handleUpload);
    if (clearBtn) clearBtn.addEventListener('click', clearPhoto);
    if (scaleInput) scaleInput.addEventListener('input', updateState);
    if (rotateInput) rotateInput.addEventListener('input', updateState);

    // Dragging Events
    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', drag);
    canvas.addEventListener('mouseup', stopDrag);
    canvas.addEventListener('mouseleave', stopDrag);

    // Touch Events
    canvas.addEventListener('touchstart', touchStart, { passive: false });
    canvas.addEventListener('touchmove', touchMove, { passive: false });
    canvas.addEventListener('touchend', stopDrag);

    // Hook into the main generic 'selectColor' function if possible
    // We observe changes to the 'tshirt3dImage' src to know when color changes
    const observer = new MutationObserver(updateShirtImageFromMain);
    const tshirt3d = document.getElementById('tshirt3dImage');
    if (tshirt3d) {
        observer.observe(tshirt3d, { attributes: true, attributeFilter: ['src'] });
        // Initial load
        updateShirtImageFromMain();
    }

    function handleUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                userImage = img;
                startTryOn();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function startTryOn() {
        // Switch visibility
        const modelImg = document.getElementById('modelImage');
        if (modelImg) modelImg.classList.add('hidden');
        canvas.classList.remove('hidden');

        // Reset state relative to canvas center
        // We need to set canvas size to match the image aspect ratio but fit within container
        const container = canvas.parentElement;
        const maxWidth = container.clientWidth;
        const maxHeight = 700; // max-height in CSS

        // Calculate aspect ratio fit
        const scale = Math.min(maxWidth / userImage.width, maxHeight / userImage.height);
        canvas.width = userImage.width * scale;
        canvas.height = userImage.height * scale;

        // Center shirt initially
        state.x = canvas.width / 2;
        state.y = canvas.height / 3; // Initial chest position approx
        state.scale = parseFloat(scaleInput.value) / 100;
        state.rotation = parseFloat(rotateInput.value);

        infoStatus.textContent = "Drag to move • Use sliders to fit";

        draw();
    }

    function clearPhoto() {
        userImage = null;
        canvas.classList.add('hidden');
        document.getElementById('modelImage').classList.remove('hidden');
        fileInput.value = '';
        infoStatus.textContent = "Upload a photo to start.";
    }

    function updateShirtImageFromMain() {
        // Get the current t-shirt source from the DOM (which is updated by the main page logic)
        const imgSrc = document.getElementById('tshirt3dImage').src;
        if (!imgSrc) return;

        const img = new Image();
        img.onload = () => {
            shirtImage = img;
            if (userImage) draw();
        };
        img.src = imgSrc;
    }

    function updateState() {
        if (!userImage) return;
        state.scale = parseFloat(scaleInput.value) / 100;
        state.rotation = parseFloat(rotateInput.value);
        draw();
    }

    function draw() {
        if (!ctx || !userImage) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Background (User Photo)
        ctx.drawImage(userImage, 0, 0, canvas.width, canvas.height);

        // Draw Shirt Overlay
        if (shirtImage) {
            ctx.save();
            ctx.translate(state.x, state.y);
            ctx.rotate(state.rotation * Math.PI / 180);
            ctx.scale(state.scale, state.scale);

            // Draw centered
            const w = canvas.width * 0.5; // Base size relative to canvas
            const h = w * (shirtImage.height / shirtImage.width);

            ctx.drawImage(shirtImage, -w / 2, -h / 2, w, h);

            ctx.restore();
        }
    }

    // Interaction Handlers
    function startDrag(e) {
        if (!userImage) return;
        state.isDragging = true;
        const rect = canvas.getBoundingClientRect();
        state.lastX = e.clientX - rect.left;
        state.lastY = e.clientY - rect.top;
    }

    function drag(e) {
        if (!state.isDragging) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const dx = currentX - state.lastX;
        const dy = currentY - state.lastY;

        state.x += dx;
        state.y += dy;

        state.lastX = currentX;
        state.lastY = currentY;

        draw();
    }

    function stopDrag() {
        state.isDragging = false;
    }

    function touchStart(e) {
        if (!userImage) return;
        e.preventDefault();
        state.isDragging = true;
        const rect = canvas.getBoundingClientRect();
        state.lastX = e.touches[0].clientX - rect.left;
        state.lastY = e.touches[0].clientY - rect.top;
    }

    function touchMove(e) {
        if (!state.isDragging) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const currentX = e.touches[0].clientX - rect.left;
        const currentY = e.touches[0].clientY - rect.top;

        const dx = currentX - state.lastX;
        const dy = currentY - state.lastY;

        state.x += dx;
        state.y += dy;

        state.lastX = currentX;
        state.lastY = currentY;

        draw();
    }
};
