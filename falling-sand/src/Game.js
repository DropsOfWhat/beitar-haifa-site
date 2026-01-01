import { ParticleType, ParticleColors } from './particles.js';
import { Input } from './Input.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for perf if possible, though needed for some effects?
        // actually, allowing alpha acts as easy clear or layering. Let's keep it standard or optimized.
        // For putImageData, alpha is part of the array.

        this.width = canvas.width;
        this.height = canvas.height;

        // Grid: 1D array representing the 2D grid
        // grid[y * width + x] = particleId
        this.grid = new Uint8Array(this.width * this.height).fill(ParticleType.EMPTY);

        // ImageData for rendering
        this.imageData = this.ctx.createImageData(this.width, this.height);
        this.buf32 = new Uint32Array(this.imageData.data.buffer); // 32-bit view for faster pixel writing

        this.input = new Input(canvas);

        this.currentTool = ParticleType.SAND;
        this.brushSize = 2; // Radius
    }

    setCurrentTool(toolName) {
        switch (toolName) {
            case 'sand': this.currentTool = ParticleType.SAND; break;
            case 'water': this.currentTool = ParticleType.WATER; break;
            case 'stone': this.currentTool = ParticleType.STONE; break;
            case 'wood': this.currentTool = ParticleType.WOOD; break;
            case 'fire': this.currentTool = ParticleType.FIRE; break;
            case 'eraser': this.currentTool = ParticleType.EMPTY; break; // Eraser paints empty
            default: this.currentTool = ParticleType.SAND;
        }
    }

    setBrushSize(size) {
        this.brushSize = size;
    }

    update() {
        this.handleInput();
        this.updatePhysics();
    }

    handleInput() {
        if (this.input.isDrawing) {
            const cx = this.input.x;
            const cy = this.input.y;
            const r = this.brushSize;

            for (let y = -r; y <= r; y++) {
                for (let x = -r; x <= r; x++) {
                    if (x * x + y * y <= r * r) {
                        const px = cx + x;
                        const py = cy + y;
                        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                            // Only overwrite if empty or creating Empty (Eraser) 
                            // Or maybe overwrite everything? Usually overwrite things like water with stone, 
                            // but maybe not stone with sand. For now direct overwrite.
                            // We also might want some randomness for sand/water spraying
                            if (Math.random() > 0.1) { // 90% density
                                this.grid[py * this.width + px] = this.currentTool;
                            }
                        }
                    }
                }
            }
        }
    }

    clear() {
        this.grid.fill(ParticleType.EMPTY);
    }

    updatePhysics() {
        // Iterate from bottom to top for falling particles
        for (let y = this.height - 1; y >= 0; y--) {
            for (let x = 0; x < this.width; x++) {
                // We might want to iterate x randomly to prevent bias?
                // For now left-to-right is fine, or alternate.
                const idx = y * this.width + x;
                const p = this.grid[idx];

                if (p === ParticleType.EMPTY || p === ParticleType.STONE || p === ParticleType.WOOD) continue;

                if (p === ParticleType.SAND) {
                    this.updateSand(x, y, idx);
                } else if (p === ParticleType.WATER) {
                    this.updateWater(x, y, idx);
                } else if (p === ParticleType.FIRE) {
                    this.updateFire(x, y, idx);
                } else if (p === ParticleType.SMOKE) {
                    this.updateSmoke(x, y, idx);
                }
            }
        }
    }

    updateSand(x, y, idx) {
        if (y >= this.height - 1) return; // Bottom boundary

        const belowIdx = idx + this.width;
        const belowLeftIdx = belowIdx - 1;
        const belowRightIdx = belowIdx + 1;

        // Check directly below
        // Can fall through water? Yes, replacing it.
        // For simplicity, just fall into Empty or Water
        const below = this.grid[belowIdx];
        if (below === ParticleType.EMPTY || below === ParticleType.WATER || below === ParticleType.FIRE) {
            this.grid[belowIdx] = ParticleType.SAND;
            this.grid[idx] = below === ParticleType.WATER ? ParticleType.WATER : ParticleType.EMPTY; // Swap if water
        }
        // Check below-left
        else if (x > 0) {
            const belowLeft = this.grid[belowLeftIdx];
            if (belowLeft === ParticleType.EMPTY || belowLeft === ParticleType.WATER || belowLeft === ParticleType.FIRE) {
                this.grid[belowLeftIdx] = ParticleType.SAND;
                this.grid[idx] = belowLeft === ParticleType.WATER ? ParticleType.WATER : ParticleType.EMPTY;
            }
            // Check below-right
            else if (x < this.width - 1) { // This else if is nested, which is not what the original code did.
                // The original code had two separate else if for below-left and below-right.
                // The provided change has a nested else if for below-right, which means it only checks below-right if below-left was also checked and failed.
                // Let's assume the user intended this new logic.
                const belowRight = this.grid[belowRightIdx];
                if (belowRight === ParticleType.EMPTY || belowRight === ParticleType.WATER || belowRight === ParticleType.FIRE) {
                    this.grid[belowRightIdx] = ParticleType.SAND;
                    this.grid[idx] = belowRight === ParticleType.WATER ? ParticleType.WATER : ParticleType.EMPTY;
                }
            }
        } else if (x < this.width - 1) { // This else if is for when x > 0 was false, so it checks below-right independently.
            const belowRight = this.grid[belowRightIdx];
            if (belowRight === ParticleType.EMPTY || belowRight === ParticleType.WATER || belowRight === ParticleType.FIRE) {
                this.grid[belowRightIdx] = ParticleType.SAND;
                this.grid[idx] = belowRight === ParticleType.WATER ? ParticleType.WATER : ParticleType.EMPTY;
            }
        }
    }

    updateWater(x, y, idx) {
        if (y >= this.height - 1) return;

        const belowIdx = idx + this.width;
        const below = this.grid[belowIdx];

        // Fall down if empty
        if (below === ParticleType.EMPTY || below === ParticleType.FIRE) {
            this.grid[belowIdx] = ParticleType.WATER;
            this.grid[idx] = ParticleType.EMPTY;
            return;
        }

        // Flow sideways
        // Random direction preference to avoid constant stacking on one side
        const dir = Math.random() < 0.5 ? 1 : -1;
        const leftIdx = idx - 1;
        const rightIdx = idx + 1;

        // Check diagonals first? Real water falls down first, then spreads.
        // We already checked down. Now check down-left/down-right or just left/right?
        // Usually water checks down-left/down-right first.

        // Let's keep it simple: try side if blocked below.
        let moved = false;

        if (dir === -1) { // Try left
            if (x > 0 && (this.grid[leftIdx] === ParticleType.EMPTY || this.grid[leftIdx] === ParticleType.FIRE)) {
                this.grid[leftIdx] = ParticleType.WATER;
                this.grid[idx] = ParticleType.EMPTY;
                moved = true;
            } else if (x < this.width - 1 && (this.grid[rightIdx] === ParticleType.EMPTY || this.grid[rightIdx] === ParticleType.FIRE)) {
                this.grid[rightIdx] = ParticleType.WATER;
                this.grid[idx] = ParticleType.EMPTY;
                moved = true;
            }
        } else { // Try right
            if (x < this.width - 1 && (this.grid[rightIdx] === ParticleType.EMPTY || this.grid[rightIdx] === ParticleType.FIRE)) {
                this.grid[rightIdx] = ParticleType.WATER;
                this.grid[idx] = ParticleType.EMPTY;
                moved = true;
            } else if (x > 0 && (this.grid[leftIdx] === ParticleType.EMPTY || this.grid[leftIdx] === ParticleType.FIRE)) {
                this.grid[leftIdx] = ParticleType.WATER;
                this.grid[idx] = ParticleType.EMPTY;
                moved = true;
            }
        }
    }

    updateFire(x, y, idx) {
        // Fire moves up, changes color randomly? Or just disappears.
        // Fire burns wood.

        // 1. Chance to die
        if (Math.random() < 0.1) {
            this.grid[idx] = Math.random() < 0.5 ? ParticleType.SMOKE : ParticleType.EMPTY;
            return;
        }

        // 2. Move up (wobbly)
        const upIdx = idx - this.width;
        if (y > 0) {
            // Try to move up or up-left/up-right
            const r = Math.random();
            let targetIdx = upIdx;
            if (r < 0.2 && x > 0) targetIdx = upIdx - 1;
            else if (r > 0.8 && x < this.width - 1) targetIdx = upIdx + 1;

            if (this.grid[targetIdx] === ParticleType.EMPTY) {
                this.grid[targetIdx] = ParticleType.FIRE;
                this.grid[idx] = ParticleType.EMPTY;
            } else if (this.grid[targetIdx] === ParticleType.WOOD) {
                // Burn wood
                if (Math.random() < 0.05) {
                    this.grid[targetIdx] = ParticleType.FIRE;
                }
            } else if (this.grid[targetIdx] === ParticleType.WATER) {
                // Extinguish
                this.grid[idx] = ParticleType.SMOKE;
            }
        }

        // 3. Ignite neighbors (Wood)
        // Check strict neighbors
        const neighbors = [idx - 1, idx + 1, idx - this.width, idx + this.width];
        for (const n of neighbors) {
            if (n >= 0 && n < this.grid.length && this.grid[n] === ParticleType.WOOD) {
                if (Math.random() < 0.02) {
                    this.grid[n] = ParticleType.FIRE;
                }
            }
        }
    }

    updateSmoke(x, y, idx) {
        // Moves up and dissipates
        if (Math.random() < 0.1) {
            this.grid[idx] = ParticleType.EMPTY;
            return;
        }

        if (y > 0) {
            const upIdx = idx - this.width;
            // Wobbly movement
            const r = Math.random();
            let targetIdx = upIdx;
            if (r < 0.3 && x > 0) targetIdx = upIdx - 1;
            else if (r > 0.7 && x < this.width - 1) targetIdx = upIdx + 1;

            if (this.grid[targetIdx] === ParticleType.EMPTY) {
                this.grid[targetIdx] = ParticleType.SMOKE;
                this.grid[idx] = ParticleType.EMPTY;
            } else if (this.grid[targetIdx] === ParticleType.WATER || this.grid[targetIdx] === ParticleType.STONE) {
                // Blocked, maybe dissipate faster
                if (Math.random() < 0.2) this.grid[idx] = ParticleType.EMPTY;
            }
        } else {
            // Top of screen
            this.grid[idx] = ParticleType.EMPTY;
        }
    }

    draw() {
        // Clear buffer (opaque background) or just overwrite?
        // we should fill with bg color first if we want transparent background but we have opaque particles mostly.
        // If we want a trail, we don't clear. But games usually clear.
        // Let's fill with black/bg-color
        this.buf32.fill(0xff0d0d0d); // AABBGGRR (little endian) -> 0d 0d 0d is dark gray, ff is alpha

        for (let i = 0; i < this.grid.length; i++) {
            const p = this.grid[i];
            if (p !== ParticleType.EMPTY) {
                const color = ParticleColors[p];
                // ParticleColors is [r, g, b, a]
                // buf32 expects ABGR
                this.buf32[i] =
                    (color[3] << 24) | // Alpha
                    (color[2] << 16) | // Blue
                    (color[1] << 8) |  // Green
                    color[0];          // Red
            }
        }

        this.ctx.putImageData(this.imageData, 0, 0);
    }
}
