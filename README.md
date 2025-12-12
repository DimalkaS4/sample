# DianEro Website

This is a premium, animated website for the DianEro brand, featuring an AI-powered Virtual Try-On experience.

## Virtual Try-On Feature

The Virtual Try-On feature uses advanced AI and image processing to let customers visualize how t-shirts will look on them.

### How It Works:
1. **Select a Color**: Choose from White, Black, or Navy Blue t-shirts
2. **Switch to Model View**: Click "On Model" to see the try-on interface
3. **Upload Your Photo**: Click "Upload Photo" and select a clear photo showing your upper body
4. **AI Auto-Fit**: Click the "FIT ON (AI)" button to automatically fit the t-shirt to your photo using pose detection
5. **Fine-tune**: Use the sliders or drag the t-shirt to adjust position, scale, and rotation

### Technologies Used:
- **TensorFlow.js**: Machine learning in the browser
- **PoseNet**: AI-powered pose detection to identify shoulders and body position
- **Canvas API**: Advanced image processing and overlay
- **GSAP**: Smooth animations

### Important Note:
Due to browser security restrictions (CORS), the Virtual Try-On feature **will not work** if you simply double-click `index.html` to open it in your browser. The browser will block access to the image data.

**To use the Virtual Try-On:**
1.  Open this folder in VS Code.
2.  Install the **Live Server** extension.
3.  Right-click `index.html` and select **"Open with Live Server"**.
4.  The site will open at `http://127.0.0.1:5500/` and the try-on feature will work perfectly.

## Features
- **Men's Section**: Virtual try-on for men's t-shirts
- **Women's Section**: Virtual try-on for women's t-shirts
- **3D T-Shirt Viewer**: Interactive 3D visualization with rotation and zoom
- **AI-Powered Fitting**: Automatic t-shirt positioning using pose detection
- **Manual Adjustment**: Fine-tune the fit with intuitive controls
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technologies
-   HTML5
-   CSS3 (Variables, Flexbox, Grid, Animations)
-   JavaScript ES6+
-   TensorFlow.js & PoseNet (AI/ML)
-   GSAP (Animation library)
-   Canvas API (Image processing)
-   Tailwind CSS (Styling)
