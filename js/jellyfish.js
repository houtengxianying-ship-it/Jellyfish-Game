// Jellyfish type definitions and rendering
const JELLYFISH_TYPES = [
    null, // index 0 unused
    { name: 'アカクラゲ',     radius: 17, bodyColor: '#FF6B8A', tentacleColor: '#FF4567', score: 1 },
    { name: 'モモクラゲ',     radius: 24, bodyColor: '#FF8FA0', tentacleColor: '#FF7088', score: 3 },
    { name: 'サクラクラゲ',   radius: 30, bodyColor: '#E88BBF', tentacleColor: '#D468A8', score: 6 },
    { name: 'ムラサキクラゲ', radius: 37, bodyColor: '#9B6BCD', tentacleColor: '#7B4DAF', score: 10 },
    { name: 'アオクラゲ',     radius: 45, bodyColor: '#6B8BCD', tentacleColor: '#4A6DB5', score: 15 },
    { name: 'ミズクラゲ',     radius: 52, bodyColor: '#7BA8D4', tentacleColor: '#5C8FBF', score: 21 },
    { name: 'カブトクラゲ',   radius: 60, bodyColor: '#5BBFA0', tentacleColor: '#3DAA85', score: 28 },
    { name: 'キクラゲ',       radius: 69, bodyColor: '#E8D44B', tentacleColor: '#D4B832', score: 36 },
    { name: 'タコクラゲ',     radius: 77, bodyColor: '#D4A043', tentacleColor: '#BF8A2E', score: 45 },
    { name: 'オワンクラゲ',   radius: 87, bodyColor: '#E8D8A0', tentacleColor: '#D4C48A', score: 55 },
    { name: 'エチゼンクラゲ', radius: 98, bodyColor: '#FFF0D0', tentacleColor: '#FFE0A0', score: 66 },
];

function drawJellyfish(ctx, x, y, radius, type, alpha) {
    alpha = alpha || 1.0;
    const jelly = JELLYFISH_TYPES[type];
    if (!jelly) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Bubble (outer sphere)
    drawBubble(ctx, x, y, radius);

    // Jellyfish creature inside
    drawJellyfishCreature(ctx, x, y, radius, type);

    ctx.restore();
}

function drawBubble(ctx, x, y, radius) {
    // Main bubble
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180, 210, 255, 0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 210, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Specular highlight (top-left)
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y - radius * 0.35, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();

    // Secondary highlight
    ctx.beginPath();
    ctx.arc(x - radius * 0.15, y - radius * 0.45, radius * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();
}

function drawJellyfishCreature(ctx, x, y, radius, type) {
    const jelly = JELLYFISH_TYPES[type];
    const bellRadius = radius * 0.55;
    const bellY = y - radius * 0.1;

    // Glow effect
    ctx.save();
    ctx.shadowBlur = radius * 0.4;
    ctx.shadowColor = jelly.bodyColor + '66';

    // Bell (dome shape)
    ctx.beginPath();
    ctx.arc(x, bellY, bellRadius, Math.PI, 0);
    // Bottom curve of bell
    ctx.quadraticCurveTo(
        x + bellRadius * 0.7, bellY + bellRadius * 0.35,
        x, bellY + bellRadius * 0.2
    );
    ctx.quadraticCurveTo(
        x - bellRadius * 0.7, bellY + bellRadius * 0.35,
        x - bellRadius, bellY
    );
    ctx.closePath();

    // Gradient fill
    const grad = ctx.createRadialGradient(
        x, bellY - bellRadius * 0.3, 0,
        x, bellY, bellRadius
    );
    grad.addColorStop(0, jelly.bodyColor + 'DD');
    grad.addColorStop(0.6, jelly.bodyColor + '99');
    grad.addColorStop(1, jelly.bodyColor + '44');
    ctx.fillStyle = grad;
    ctx.fill();

    // Bell edge highlight
    ctx.strokeStyle = jelly.bodyColor + '88';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // Inner pattern (spots/stripes for larger types)
    if (type >= 4) {
        const spotCount = Math.min(type - 2, 6);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < spotCount; i++) {
            const angle = (Math.PI / (spotCount + 1)) * (i + 1);
            const sx = x + Math.cos(angle + Math.PI) * bellRadius * 0.4;
            const sy = bellY - Math.sin(angle) * bellRadius * 0.3;
            const sr = bellRadius * 0.08;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Tentacles
    const tentacleCount = 3 + Math.floor(type / 3);
    const tentacleLength = bellRadius * (0.6 + type * 0.05);
    const startY = bellY + bellRadius * 0.15;
    const time = Date.now() * 0.002;

    ctx.strokeStyle = jelly.tentacleColor + '88';
    ctx.lineWidth = Math.max(1, radius * 0.035);
    ctx.lineCap = 'round';

    for (let i = 0; i < tentacleCount; i++) {
        const t = i / (tentacleCount - 1);
        const tx = x - bellRadius * 0.5 + bellRadius * t;
        const wave1 = Math.sin(time + i * 1.3) * radius * 0.08;
        const wave2 = Math.cos(time * 0.7 + i * 0.9) * radius * 0.05;

        ctx.beginPath();
        ctx.moveTo(tx, startY);
        ctx.quadraticCurveTo(
            tx + wave1, startY + tentacleLength * 0.5,
            tx + wave2, startY + tentacleLength
        );
        ctx.stroke();
    }

    // Frilly edge at bell bottom
    ctx.strokeStyle = jelly.bodyColor + '66';
    ctx.lineWidth = 0.8;
    const frillyCount = 8 + type;
    for (let i = 0; i < frillyCount; i++) {
        const t = i / frillyCount;
        const angle = Math.PI + t * Math.PI * 0.6 - Math.PI * 0.3;
        const fx = x + Math.cos(angle) * bellRadius * 0.65;
        const fy = bellY + Math.sin(angle) * bellRadius * 0.15 + bellRadius * 0.15;
        const wv = Math.sin(time * 1.5 + i) * 2;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + wv, fy + bellRadius * 0.1);
        ctx.stroke();
    }
}
