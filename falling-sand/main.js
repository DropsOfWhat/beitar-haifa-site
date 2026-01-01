import './style.css';
import { Game } from './src/Game.js';

const canvas = document.getElementById('game-canvas');
// Set canvas size (keep it relatively small for performance, scale up with CSS if needed, 
// but for pixel games 1:1 or integer scale is best. Let's start with a fixed size)
canvas.width = 400;
canvas.height = 400;

const game = new Game(canvas);

// Toolbar interaction
const tools = document.querySelectorAll('.tool');
tools.forEach(btn => {
    btn.addEventListener('click', () => {
        tools.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        game.setCurrentTool(btn.dataset.tool);
    });
});

// Brush size
const sizeInput = document.getElementById('brush-size');
sizeInput.addEventListener('input', (e) => {
    game.setBrushSize(parseInt(e.target.value, 10));
});

document.getElementById('clear-btn').addEventListener('click', () => {
    game.clear();
});

function animate() {
    game.update();
    game.draw();
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
