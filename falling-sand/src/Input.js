export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.isDrawing = false; // Mouse/Touch down

        this.bindEvents();
    }

    bindEvents() {
        const updatePos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            // Handle both mouse and touch events
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            this.x = Math.floor((clientX - rect.left) * scaleX);
            this.y = Math.floor((clientY - rect.top) * scaleY);
        };

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            updatePos(e);
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDrawing) updatePos(e);
        });
        window.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            // Prevent scrolling
            e.preventDefault();
            this.isDrawing = true;
            updatePos(e);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDrawing) updatePos(e);
        }, { passive: false });
        window.addEventListener('touchend', () => {
            this.isDrawing = false;
        });
    }
}
