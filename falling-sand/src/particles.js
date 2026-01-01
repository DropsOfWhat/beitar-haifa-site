export const ParticleType = {
    EMPTY: 0,
    SAND: 1,
    WATER: 2,
    STONE: 3,
    WOOD: 4,
    FIRE: 5,
    SMOKE: 6, // Bonus visual
};

export const ParticleColors = {
    [ParticleType.EMPTY]: [0, 0, 0, 0], // Transparent
    [ParticleType.SAND]: [226, 192, 123, 255], // #e2c07b
    [ParticleType.WATER]: [59, 130, 246, 200], // #3b82f6 with alpha
    [ParticleType.STONE]: [115, 115, 115, 255], // #737373
    [ParticleType.WOOD]: [120, 53, 15, 255], // #78350f
    [ParticleType.FIRE]: [239, 68, 68, 255], // #ef4444
    [ParticleType.SMOKE]: [160, 160, 160, 150],
};

// Simple update rules (will be expanded in Game.js or here)
// For now just data.
