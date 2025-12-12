/**
 * DianEro - User Photo Virtual Try-On
 * Handles uploading a user photo, manual overlay, and AI Auto-Fit.
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
    let posenetModel = null; // Store the AI model
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

    // Observe shirt changes from the main 3D view
    const observer = new MutationObserver(updateShirtImageFromMain);
    const tshirt3d = document.getElementById('tshirt3dImage');
    if (tshirt3d) {
        observer.observe(tshirt3d, { attributes: true, attributeFilter: ['src'] });
        updateShirtImageFromMain(); // Initial load
    }

    // --- AI AUTO-FIT FUNCTIONALITY ---
    
    // Make this function available globally so the HTML button can call it
    window.requestGeminiTryOn = async function() {
        if (!userImage) {
            alert("Please upload a photo first!");
            return;
        }

        infoStatus.textContent = "🤖 AI is analyzing your pose...";
        infoStatus.style.color = "#3b82f6";

        try {
            // 1. Load PoseNet if not already loaded
            if (!posenetModel) {
                // Ensure TensorFlow is loaded
                if (typeof posenet === 'undefined') {
                    throw new Error("TensorFlow/PoseNet libraries not loaded in HTML.");
                }
                posenetModel = await posenet.load();
            }

            // 2. Estimate Pose
            const pose = await posenetModel.estimateSinglePose(userImage, {
                flipHorizontal: false
            });

            // 3. Find Shoulders
            const leftShoulder = pose.keypoints.find(k => k.part === 'leftShoulder');
            const rightShoulder = pose.keypoints.find(k => k.part === 'rightShoulder');

            if (leftShoulder.score > 0.5 && rightShoulder.score > 0.5) {
                // 4. Calculate Center and Width
                const shoulderCenterX = (leftShoulder.position.x + rightShoulder.position.x) / 2;
                const shoulderCenterY = (leftShoulder.position.y + rightShoulder.position.y) / 2;
                
                // Calculate distance between shoulders
                const shoulderWidth = Math.sqrt(
                    Math.pow(rightShoulder.position.x - leftShoulder.position.x, 2) +
                    Math.pow(rightShoulder.position.y - leftShoulder.position.y, 2)
                );

                // 5. Apply to State
                // Position: Center the shirt on the midpoint between shoulders
                // We offset Y slightly down because the shirt image center is usually the chest/stomach, not the neck
                state.x = shoulderCenterX;
                state.y = shoulderCenterY + (shoulderWidth * 0.5); 

                // Scale: Map shoulder width to shirt width
                // The factor (e.g., 2.5) depends on how wide your shirt image file is compared to real shoulders
                if (shirtImage) {
                     // Get canvas scaling factor (since canvas might be scaled relative to original image)
                    const canvasScaleFactor = canvas.width / userImage.width;
                    
                    // Base scale calculation
                    const estimatedShirtWidth = shoulderWidth * 3.0; // Multiplier to make shirt wider than shoulders
                    state.scale = (estimatedShirtWidth / shirtImage.width) * canvasScaleFactor;
                }

                // Rotation: Calculate angle between shoulders
                const angleRad = Math.atan2(
                    rightShoulder.position.y - leftShoulder.position.y,
                    rightShoulder.position.x - leftShoulder.position.x
                );
                // Convert to degrees and adjust (shoulders are usually level 0)
                // Note: PoseNet left/right are from viewer perspective, might need inversion based on image
                state.rotation = angleRad * (180 / Math.PI);

                // 6. Update UI Controls to match new state
                scaleInput.value = Math.min(Math.max(state.scale * 100, 50), 170);
                rotateInput.value = state.rotation;

                infoStatus.textContent = "✨ Auto-fit complete! Adjust if needed.";
                infoStatus.style.color = "";
                
                draw();
            } else {
                infoStatus.textContent = "Could not clearly detect shoulders. Please try a clearer photo.";
            }

        } catch (error) {
            console.error("AI Try-On Error:", error);
            infoStatus.textContent = "AI Error. Please fit manually.";
        }
    };

    // --- STANDARD FUNCTIONS ---

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
        const modelImg = document.getElementById('modelImage');
        if (modelImg) modelImg.classList.add('hidden');
        canvas.classList.remove('hidden');

        const container = canvas.parentElement;
        const maxWidth = container.clientWidth;
        const maxHeight = 700;

        const scale = Math.min(maxWidth / userImage.width, maxHeight / userImage.height);
        canvas.width = userImage.width * scale;
        canvas.height = userImage.height * scale;

        // Default Manual Position
        state.x = canvas.width / 2;
        state.y = canvas.height / 3;
        state.scale = parseFloat(scaleInput.value) / 100;
        state.rotation = parseFloat(rotateInput.value);

        infoStatus.textContent = "Drag to move • Use sliders to fit • Or click Auto Fit";
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
        const tshirt3d = document.getElementById('tshirt3dImage');
        if (!tshirt3d) return;
        
        const imgSrc = tshirt3d.src;
        if (!imgSrc) return;

        const img = new Image();
        img.crossOrigin = "anonymous"; // Helpful for some browser security
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

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Save context for scaling background image properly
        ctx.save();
        // The canvas dimensions are already scaled, so we draw image to fill it
        ctx.drawImage(userImage, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        if (shirtImage) {
            ctx.save();
            ctx.translate(state.x, state.y);
            ctx.rotate(state.rotation * Math.PI / 180);
            ctx.scale(state.scale, state.scale);

            // Draw centered relative to translation point
            // We use natural dimensions of shirt for aspect ratio
            const w = canvas.width * 0.5; // Base arbitrary width
            const h = w * (shirtImage.height / shirtImage.width);

            ctx.drawImage(shirtImage, -w / 2, -h / 2, w, h);
            ctx.restore();
        }
    }

    // Interaction Handlers (Mouse)
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

        state.x += (currentX - state.lastX);
        state.y += (currentY - state.lastY);
        state.lastX = currentX;
        state.lastY = currentY;
        draw();
    }

    function stopDrag() {
        state.isDragging = false;
    }

    // Interaction Handlers (Touch)
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

        state.x += (currentX - state.lastX);
        state.y += (currentY - state.lastY);
        state.lastX = currentX;
        state.lastY = currentY;
        draw();
    }
};
