// Deep ocean background rendering
const BG = {
    particles: [],
    initialized: false,
};

function initBackground() {
    BG.particles = [];
    for (let i = 0; i < 30; i++) {
        BG.particles.push({
            x: Math.random() * GAME.CANVAS_WIDTH,
            y: Math.random() * GAME.CANVAS_HEIGHT,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.3 + 0.1,
            alpha: Math.random() * 0.3 + 0.1,
            drift: Math.random() * 0.5 - 0.25,
        });
    }
    BG.initialized = true;
}

function drawBackground(ctx, canvas) {
    if (!BG.initialized) initBackground();

    // Deep ocean gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0A2A4A');
    grad.addColorStop(0.3, '#0D3B5E');
    grad.addColorStop(0.7, '#082840');
    grad.addColorStop(1, '#051A2E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Light rays from top-right
    drawLightRays(ctx, canvas);

    // Floating particles
    drawParticles(ctx, canvas);
}

function drawLightRays(ctx, canvas) {
    ctx.save();
    for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = 0.03 + i * 0.008;
        ctx.fillStyle = '#88CCFF';
        ctx.beginPath();
        const startX = canvas.width * (0.35 + i * 0.14);
        const width = 25 + i * 8;
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX + width, 0);
        ctx.lineTo(startX - 80 + i * 25, canvas.height);
        ctx.lineTo(startX - 80 - width + i * 25, canvas.height);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function drawParticles(ctx, canvas) {
    ctx.save();
    for (const p of BG.particles) {
        p.y -= p.speed;
        p.x += p.drift + Math.sin(Date.now() * 0.001 + p.y * 0.01) * 0.2;

        if (p.y < -10) {
            p.y = canvas.height + 10;
            p.x = Math.random() * canvas.width;
        }
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#AAD4FF';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
