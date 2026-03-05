// Jellyfish type definitions and rendering
// shape: 'round'=丸型, 'flat'=扁平, 'tall'=縦長, 'dome'=ドーム,
//        'disc'=円盤, 'helmet'=兜型, 'ruffle'=フリル型, 'bulb'=球根型,
//        'flower'=花型, 'bowl'=椀型, 'giant'=巨大ドーム
const JELLYFISH_TYPES = [
    null, // index 0 unused
    { name: 'アカクラゲ',     radius: 15,  bodyColor: '#FF4060', tentacleColor: '#E02040', score: 1,  shape: 'round' },
    { name: 'モモクラゲ',     radius: 22,  bodyColor: '#FF80C0', tentacleColor: '#E060A0', score: 3,  shape: 'flat' },
    { name: 'ムラサキクラゲ', radius: 30,  bodyColor: '#A050E0', tentacleColor: '#7830C0', score: 6,  shape: 'tall' },
    { name: 'アオクラゲ',     radius: 38,  bodyColor: '#4080FF', tentacleColor: '#2060E0', score: 10, shape: 'dome' },
    { name: 'ミズクラゲ',     radius: 48,  bodyColor: '#40D0E0', tentacleColor: '#20B0C8', score: 15, shape: 'disc' },
    { name: 'カブトクラゲ',   radius: 56,  bodyColor: '#40E880', tentacleColor: '#20C860', score: 21, shape: 'helmet' },
    { name: 'キクラゲ',       radius: 66,  bodyColor: '#E0E040', tentacleColor: '#C8C020', score: 28, shape: 'ruffle' },
    { name: 'タコクラゲ',     radius: 76,  bodyColor: '#FF8820', tentacleColor: '#E06800', score: 36, shape: 'bulb' },
    { name: 'サクラクラゲ',   radius: 88,  bodyColor: '#FF5080', tentacleColor: '#E03060', score: 45, shape: 'flower' },
    { name: 'オワンクラゲ',   radius: 100, bodyColor: '#C0F0FF', tentacleColor: '#90D8F0', score: 55, shape: 'bowl' },
    { name: 'エチゼンクラゲ', radius: 115, bodyColor: '#FFD040', tentacleColor: '#F0B020', score: 66, shape: 'giant' },
];

function drawJellyfish(ctx, x, y, radius, type, alpha) {
    alpha = alpha || 1.0;
    const jelly = JELLYFISH_TYPES[type];
    if (!jelly) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    drawBubble(ctx, x, y, radius, jelly.shape, type);
    drawJellyfishCreature(ctx, x, y, radius, type);

    ctx.restore();
}

function drawBubble(ctx, x, y, radius, shape, type) {
    var time = Date.now() * 0.001;
    var pulse = getPulse(type);
    var r = radius * pulse;

    ctx.beginPath();

    switch (shape) {
        case 'flat':
            // 横長の楕円
            ctx.ellipse(x, y, r * 1.2, r * 0.8, 0, 0, Math.PI * 2);
            break;

        case 'tall':
            // 縦長の楕円
            ctx.ellipse(x, y, r * 0.75, r * 1.15, 0, 0, Math.PI * 2);
            break;

        case 'dome':
            // 上が膨らんだしずく型
            ctx.moveTo(x + r, y + r * 0.1);
            ctx.bezierCurveTo(x + r, y - r * 0.8, x + r * 0.5, y - r, x, y - r);
            ctx.bezierCurveTo(x - r * 0.5, y - r, x - r, y - r * 0.8, x - r, y + r * 0.1);
            ctx.quadraticCurveTo(x - r * 0.6, y + r, x, y + r * 0.85);
            ctx.quadraticCurveTo(x + r * 0.6, y + r, x + r, y + r * 0.1);
            break;

        case 'disc':
            // 平たい円盤（上下が潰れた形）
            ctx.ellipse(x, y - r * 0.05, r * 1.15, r * 0.7, 0, 0, Math.PI * 2);
            break;

        case 'helmet':
            // 六角形に近い兜型
            var hw = r * 1.05;
            var hh = r * 1.05;
            ctx.moveTo(x, y - hh);
            ctx.lineTo(x + hw * 0.8, y - hh * 0.5);
            ctx.lineTo(x + hw, y + hh * 0.15);
            ctx.quadraticCurveTo(x + hw * 0.5, y + hh, x, y + hh * 0.85);
            ctx.quadraticCurveTo(x - hw * 0.5, y + hh, x - hw, y + hh * 0.15);
            ctx.lineTo(x - hw * 0.8, y - hh * 0.5);
            ctx.closePath();
            break;

        case 'ruffle':
            // 波打つ縁の膜
            var lobes = 8;
            for (var i = 0; i <= lobes; i++) {
                var angle = (Math.PI * 2 / lobes) * i;
                var nextAngle = (Math.PI * 2 / lobes) * (i + 1);
                var wobble = 1.0 + Math.sin(time * 2.5 + i * 1.3) * 0.08;
                var rr = r * wobble;
                var px = x + Math.cos(angle) * rr;
                var py = y + Math.sin(angle) * rr;
                var cpAngle = (angle + nextAngle) / 2;
                var cpR = r * (1.12 + Math.sin(time * 2 + i * 0.9) * 0.06);
                var cpx = x + Math.cos(cpAngle) * cpR;
                var cpy = y + Math.sin(cpAngle) * cpR;
                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.quadraticCurveTo(cpx, cpy, px, py);
                }
            }
            ctx.closePath();
            break;

        case 'bulb':
            // 下膨れの洋梨型
            ctx.moveTo(x, y - r * 0.9);
            ctx.bezierCurveTo(x + r * 0.7, y - r * 0.9, x + r * 0.8, y - r * 0.3, x + r, y + r * 0.1);
            ctx.bezierCurveTo(x + r * 1.05, y + r * 0.6, x + r * 0.5, y + r, x, y + r);
            ctx.bezierCurveTo(x - r * 0.5, y + r, x - r * 1.05, y + r * 0.6, x - r, y + r * 0.1);
            ctx.bezierCurveTo(x - r * 0.8, y - r * 0.3, x - r * 0.7, y - r * 0.9, x, y - r * 0.9);
            break;

        case 'flower':
            // 花弁型（5弁の花のような輪郭）
            var petals = 5;
            for (var p = 0; p < petals; p++) {
                var a1 = (Math.PI * 2 / petals) * p - Math.PI / 2;
                var a2 = (Math.PI * 2 / petals) * (p + 1) - Math.PI / 2;
                var petalR = r * (1.1 + Math.sin(time * 2 + p * 1.5) * 0.05);
                var midA = (a1 + a2) / 2;
                var outerR = petalR * 1.15;
                var innerR = r * 0.88;
                var ox1 = x + Math.cos(a1) * innerR;
                var oy1 = y + Math.sin(a1) * innerR;
                var cpx = x + Math.cos(midA) * outerR;
                var cpy = y + Math.sin(midA) * outerR;
                if (p === 0) ctx.moveTo(ox1, oy1);
                var ox2 = x + Math.cos(a2) * innerR;
                var oy2 = y + Math.sin(a2) * innerR;
                ctx.quadraticCurveTo(cpx, cpy, ox2, oy2);
            }
            ctx.closePath();
            break;

        case 'bowl':
            // 椀型（上が開いた形）
            ctx.moveTo(x - r * 0.85, y - r * 0.6);
            ctx.quadraticCurveTo(x - r * 1.05, y - r * 0.1, x - r, y + r * 0.3);
            ctx.bezierCurveTo(x - r * 0.8, y + r, x + r * 0.8, y + r, x + r, y + r * 0.3);
            ctx.quadraticCurveTo(x + r * 1.05, y - r * 0.1, x + r * 0.85, y - r * 0.6);
            ctx.bezierCurveTo(x + r * 0.5, y - r * 1.05, x - r * 0.5, y - r * 1.05, x - r * 0.85, y - r * 0.6);
            break;

        case 'giant':
            // 不定形の巨大アメーバ型（ゆったり蠢く）
            var points = 10;
            for (var g = 0; g <= points; g++) {
                var ga = (Math.PI * 2 / points) * g;
                var gna = (Math.PI * 2 / points) * (g + 1);
                var gWobble = 1.0 + Math.sin(time * 1.2 + g * 1.7) * 0.07
                                   + Math.cos(time * 0.8 + g * 2.3) * 0.04;
                var gr = r * gWobble;
                var gx = x + Math.cos(ga) * gr;
                var gy = y + Math.sin(ga) * gr;
                var gcpA = (ga + gna) / 2;
                var gcpR = r * (1.08 + Math.sin(time * 1.5 + g * 1.1) * 0.05);
                var gcpx = x + Math.cos(gcpA) * gcpR;
                var gcpy = y + Math.sin(gcpA) * gcpR;
                if (g === 0) {
                    ctx.moveTo(gx, gy);
                } else {
                    ctx.quadraticCurveTo(gcpx, gcpy, gx, gy);
                }
            }
            ctx.closePath();
            break;

        default: // 'round' — 基本の円
            ctx.arc(x, y, r, 0, Math.PI * 2);
            break;
    }

    ctx.fillStyle = 'rgba(180, 210, 255, 0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 210, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ハイライト（形状に依存しない位置で配置）
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x - r * 0.12, y - r * 0.42, r * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();
}

// --- Pulsing animation ---
function getPulse(type) {
    var time = Date.now() * 0.001;
    // Each type has its own rhythm
    var speed = 1.5 + (type % 3) * 0.4;
    var amount = 0.06 + (type % 4) * 0.015;
    return 1.0 + Math.sin(time * speed + type * 1.7) * amount;
}

// --- Bell shape builders ---
// Returns a path-drawing function based on shape type
function drawBellShape(ctx, x, bellY, bellW, bellH, shape, type, time) {
    ctx.beginPath();

    switch (shape) {
        case 'flat':
            // Wide, flat bell
            ctx.ellipse(x, bellY, bellW, bellH * 0.55, 0, Math.PI, 0);
            ctx.quadraticCurveTo(x + bellW * 0.5, bellY + bellH * 0.3, x, bellY + bellH * 0.15);
            ctx.quadraticCurveTo(x - bellW * 0.5, bellY + bellH * 0.3, x - bellW, bellY);
            break;

        case 'tall':
            // Tall, narrow bell
            ctx.moveTo(x - bellW * 0.6, bellY);
            ctx.bezierCurveTo(
                x - bellW * 0.6, bellY - bellH * 1.4,
                x + bellW * 0.6, bellY - bellH * 1.4,
                x + bellW * 0.6, bellY
            );
            ctx.quadraticCurveTo(x + bellW * 0.3, bellY + bellH * 0.25, x, bellY + bellH * 0.1);
            ctx.quadraticCurveTo(x - bellW * 0.3, bellY + bellH * 0.25, x - bellW * 0.6, bellY);
            break;

        case 'dome':
            // Classic smooth dome
            ctx.arc(x, bellY, bellW, Math.PI, 0);
            ctx.bezierCurveTo(
                x + bellW * 0.8, bellY + bellH * 0.4,
                x - bellW * 0.8, bellY + bellH * 0.4,
                x - bellW, bellY
            );
            break;

        case 'disc':
            // Flat disc (ミズクラゲ style)
            ctx.ellipse(x, bellY - bellH * 0.1, bellW, bellH * 0.45, 0, Math.PI, 0);
            ctx.lineTo(x + bellW, bellY);
            ctx.bezierCurveTo(
                x + bellW * 0.6, bellY + bellH * 0.35,
                x - bellW * 0.6, bellY + bellH * 0.35,
                x - bellW, bellY
            );
            break;

        case 'helmet':
            // Angular helmet shape with ridges
            ctx.moveTo(x - bellW, bellY);
            ctx.lineTo(x - bellW * 0.85, bellY - bellH * 0.7);
            ctx.bezierCurveTo(
                x - bellW * 0.4, bellY - bellH * 1.3,
                x + bellW * 0.4, bellY - bellH * 1.3,
                x + bellW * 0.85, bellY - bellH * 0.7
            );
            ctx.lineTo(x + bellW, bellY);
            ctx.quadraticCurveTo(x + bellW * 0.4, bellY + bellH * 0.3, x, bellY + bellH * 0.15);
            ctx.quadraticCurveTo(x - bellW * 0.4, bellY + bellH * 0.3, x - bellW, bellY);
            break;

        case 'ruffle':
            // Ruffled/wavy edge bell
            var lobes = 7;
            ctx.moveTo(x - bellW, bellY);
            ctx.quadraticCurveTo(x - bellW, bellY - bellH * 1.2, x, bellY - bellH * 1.1);
            ctx.quadraticCurveTo(x + bellW, bellY - bellH * 1.2, x + bellW, bellY);
            // Wavy bottom edge
            for (var i = 0; i < lobes; i++) {
                var t = (i + 1) / (lobes + 1);
                var lx = x - bellW + bellW * 2 * t;
                var ly = bellY + Math.sin(time * 2 + i * 1.5) * bellH * 0.12;
                var cpx = lx - bellW * 0.08;
                var cpy = bellY + bellH * 0.25 + Math.sin(time * 1.8 + i) * bellH * 0.06;
                ctx.quadraticCurveTo(cpx, cpy, lx, ly);
            }
            ctx.quadraticCurveTo(x - bellW * 0.5, bellY + bellH * 0.2, x - bellW, bellY);
            break;

        case 'bulb':
            // Bulbous round body
            ctx.arc(x, bellY - bellH * 0.2, bellW * 0.95, Math.PI * 0.85, Math.PI * 0.15);
            ctx.quadraticCurveTo(x + bellW * 0.5, bellY + bellH * 0.5, x, bellY + bellH * 0.3);
            ctx.quadraticCurveTo(x - bellW * 0.5, bellY + bellH * 0.5, x - bellW * 0.95 * Math.cos(Math.PI * 0.15), bellY - bellH * 0.2 - bellW * 0.95 * Math.sin(Math.PI * 0.15));
            break;

        case 'flower':
            // Flower/petal-edged bell
            var petals = 8;
            ctx.arc(x, bellY, bellW * 0.8, Math.PI, 0);
            for (var p = 0; p < petals; p++) {
                var pt = p / petals;
                var px = x + bellW * 0.8 - bellW * 1.6 * pt;
                var petalOut = bellH * 0.18 + Math.sin(time * 2.5 + p * 1.2) * bellH * 0.08;
                var nx = x + bellW * 0.8 - bellW * 1.6 * ((p + 1) / petals);
                ctx.quadraticCurveTo(
                    (px + nx) / 2, bellY + petalOut,
                    nx, bellY + Math.sin(time * 2 + (p + 1)) * bellH * 0.04
                );
            }
            break;

        case 'bowl':
            // Deep bowl/cup shape (オワンクラゲ)
            ctx.moveTo(x - bellW * 0.7, bellY - bellH * 0.1);
            ctx.bezierCurveTo(
                x - bellW * 0.8, bellY - bellH * 1.0,
                x + bellW * 0.8, bellY - bellH * 1.0,
                x + bellW * 0.7, bellY - bellH * 0.1
            );
            ctx.bezierCurveTo(
                x + bellW * 0.9, bellY + bellH * 0.4,
                x - bellW * 0.9, bellY + bellH * 0.4,
                x - bellW * 0.7, bellY - bellH * 0.1
            );
            break;

        case 'giant':
            // Massive dome with flowing edges
            var wobble = Math.sin(time * 1.2) * bellW * 0.03;
            ctx.arc(x, bellY, bellW, Math.PI, 0);
            // Thick wavy bottom
            var segs = 10;
            for (var s = 0; s <= segs; s++) {
                var st = s / segs;
                var sx = x + bellW - bellW * 2 * st;
                var sy = bellY + bellH * 0.2 + Math.sin(time * 1.5 + s * 1.1) * bellH * 0.1 + wobble;
                if (s === 0) {
                    ctx.lineTo(sx, sy);
                } else {
                    var prevX = x + bellW - bellW * 2 * ((s - 1) / segs);
                    ctx.quadraticCurveTo((prevX + sx) / 2, sy + bellH * 0.08, sx, sy);
                }
            }
            ctx.closePath();
            break;

        default: // 'round'
            ctx.arc(x, bellY, bellW, Math.PI, 0);
            ctx.quadraticCurveTo(x + bellW * 0.7, bellY + bellH * 0.35, x, bellY + bellH * 0.2);
            ctx.quadraticCurveTo(x - bellW * 0.7, bellY + bellH * 0.35, x - bellW, bellY);
            break;
    }

    ctx.closePath();
}

function drawJellyfishCreature(ctx, x, y, radius, type) {
    const jelly = JELLYFISH_TYPES[type];
    const time = Date.now() * 0.001;
    const pulse = getPulse(type);

    // Bell dimensions vary by shape
    var bellW = radius * 0.55 * pulse;
    var bellH = radius * 0.55 * pulse;
    const bellY = y - radius * 0.1;

    // Shape-specific dimension tweaks
    switch (jelly.shape) {
        case 'flat':  case 'disc':  bellW *= 1.2; bellH *= 0.7; break;
        case 'tall':  bellW *= 0.7;  bellH *= 1.15; break;
        case 'helmet': bellW *= 1.05; bellH *= 1.1; break;
        case 'bulb':  bellW *= 1.1;  bellH *= 1.0; break;
        case 'giant': bellW *= 1.15; bellH *= 1.0; break;
    }

    // --- Glow ---
    ctx.save();
    var glowIntensity = 0.4 + Math.sin(time * 2 + type) * 0.15;
    ctx.shadowBlur = radius * glowIntensity;
    ctx.shadowColor = jelly.bodyColor + '88';

    // --- Draw bell shape ---
    drawBellShape(ctx, x, bellY, bellW, bellH, jelly.shape, type, time);

    // Gradient fill
    const grad = ctx.createRadialGradient(
        x, bellY - bellH * 0.3, 0,
        x, bellY, Math.max(bellW, bellH)
    );
    grad.addColorStop(0, jelly.bodyColor + 'EE');
    grad.addColorStop(0.5, jelly.bodyColor + 'AA');
    grad.addColorStop(1, jelly.bodyColor + '55');
    ctx.fillStyle = grad;
    ctx.fill();

    // Edge glow
    ctx.strokeStyle = jelly.bodyColor + '99';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // --- Inner organs / patterns ---
    drawInnerPattern(ctx, x, bellY, bellW, bellH, type, jelly, time);

    // --- Tentacles ---
    drawTentacles(ctx, x, bellY, bellW, bellH, radius, type, jelly, time);

    // --- Frilly edge ---
    drawFrillyEdge(ctx, x, bellY, bellW, bellH, type, jelly, time);
}

function drawInnerPattern(ctx, x, bellY, bellW, bellH, type, jelly, time) {
    ctx.save();

    if (jelly.shape === 'disc') {
        // ミズクラゲ: four-leaf clover organs
        ctx.globalAlpha = 0.25 + Math.sin(time * 1.5) * 0.08;
        var organR = bellW * 0.15;
        var organDist = bellW * 0.3;
        for (var i = 0; i < 4; i++) {
            var angle = (Math.PI / 2) * i + Math.PI / 4;
            var ox = x + Math.cos(angle) * organDist;
            var oy = bellY - bellH * 0.1 + Math.sin(angle) * organDist * 0.5;
            ctx.beginPath();
            ctx.ellipse(ox, oy, organR, organR * 0.7, angle, 0, Math.PI * 2);
            ctx.fillStyle = jelly.tentacleColor + 'AA';
            ctx.fill();
        }
    } else if (jelly.shape === 'bowl') {
        // オワンクラゲ: GFP glow rings
        ctx.globalAlpha = 0.15 + Math.sin(time * 2.5) * 0.1;
        ctx.strokeStyle = '#80FFB0';
        ctx.lineWidth = 1.5;
        for (var r = 0; r < 3; r++) {
            ctx.beginPath();
            ctx.arc(x, bellY - bellH * 0.3, bellW * (0.2 + r * 0.18), 0, Math.PI * 2);
            ctx.stroke();
        }
    } else if (type >= 4) {
        // Spots for larger types
        var spotCount = Math.min(type - 2, 7);
        ctx.globalAlpha = 0.12 + Math.sin(time * 2) * 0.05;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (var s = 0; s < spotCount; s++) {
            var angle = (Math.PI / (spotCount + 1)) * (s + 1);
            var sx = x + Math.cos(angle + Math.PI) * bellW * 0.4;
            var sy = bellY - Math.sin(angle) * bellH * 0.35;
            var sr = bellW * 0.06 + Math.sin(time * 3 + s) * bellW * 0.015;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

function drawTentacles(ctx, x, bellY, bellW, bellH, radius, type, jelly, time) {
    var tentacleCount = 3 + Math.floor(type / 2);
    var tentacleLength = bellH * (0.8 + type * 0.08);
    var startY = bellY + bellH * 0.15;

    ctx.save();
    ctx.lineCap = 'round';

    // Thick flowing tentacles for certain shapes
    var isThick = jelly.shape === 'bulb' || jelly.shape === 'giant';
    var baseWidth = isThick ? Math.max(2, radius * 0.06) : Math.max(1, radius * 0.035);

    for (var i = 0; i < tentacleCount; i++) {
        var t = i / (tentacleCount - 1);
        var spread = jelly.shape === 'flat' || jelly.shape === 'disc' ? 0.7 : 0.55;
        var tx = x - bellW * spread + bellW * spread * 2 * t;

        // Multi-segment bezier for more organic movement
        var wave1 = Math.sin(time * 2.2 + i * 1.5) * radius * 0.12;
        var wave2 = Math.cos(time * 1.6 + i * 1.1) * radius * 0.1;
        var wave3 = Math.sin(time * 2.8 + i * 0.8) * radius * 0.08;

        // Tapered tentacle via multiple segments
        var segments = 3;
        var px = tx, py = startY;

        for (var seg = 0; seg < segments; seg++) {
            var segT = (seg + 1) / segments;
            var segLen = tentacleLength / segments;

            var nx = tx + wave1 * segT + wave2 * segT * segT;
            var ny = py + segLen;
            var cpx = px + wave3 * segT + wave1 * 0.5;
            var cpy = py + segLen * 0.6;

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.quadraticCurveTo(cpx, cpy, nx, ny);

            // Taper width
            var width = baseWidth * (1.0 - segT * 0.6);
            ctx.lineWidth = width;
            ctx.strokeStyle = jelly.tentacleColor + (seg === 0 ? 'AA' : '66');
            ctx.stroke();

            px = nx;
            py = ny;
        }
    }

    // Extra oral arms for タコクラゲ/エチゼンクラゲ
    if (jelly.shape === 'bulb' || jelly.shape === 'giant') {
        ctx.lineWidth = Math.max(2, radius * 0.04);
        var armCount = jelly.shape === 'giant' ? 6 : 4;
        for (var a = 0; a < armCount; a++) {
            var at = a / (armCount - 1);
            var ax = x - bellW * 0.35 + bellW * 0.7 * at;
            var armLen = tentacleLength * 0.6;
            var aw1 = Math.sin(time * 1.8 + a * 2.1) * radius * 0.15;
            var aw2 = Math.cos(time * 2.3 + a * 1.4) * radius * 0.1;

            ctx.beginPath();
            ctx.moveTo(ax, startY + bellH * 0.1);
            ctx.bezierCurveTo(
                ax + aw1, startY + armLen * 0.35,
                ax + aw2, startY + armLen * 0.7,
                ax + aw1 * 0.5, startY + armLen
            );
            ctx.strokeStyle = jelly.bodyColor + '77';
            ctx.stroke();
        }
    }

    ctx.restore();
}

function drawFrillyEdge(ctx, x, bellY, bellW, bellH, type, jelly, time) {
    ctx.save();
    ctx.strokeStyle = jelly.bodyColor + '88';
    ctx.lineWidth = 1;

    var frillyCount = 10 + type * 2;
    var edgeY = bellY + bellH * 0.12;

    for (var i = 0; i < frillyCount; i++) {
        var t = i / frillyCount;
        var spread = jelly.shape === 'flat' || jelly.shape === 'disc' ? 0.85 : 0.65;
        var fx = x - bellW * spread + bellW * spread * 2 * t;
        var wave = Math.sin(time * 3 + i * 0.9) * bellH * 0.08;
        var frilLen = bellH * 0.12 + Math.sin(time * 2.5 + i * 1.3) * bellH * 0.04;

        ctx.beginPath();
        ctx.moveTo(fx, edgeY + wave * 0.3);
        ctx.quadraticCurveTo(
            fx + wave * 0.5, edgeY + frilLen * 0.5,
            fx + wave, edgeY + frilLen
        );
        ctx.stroke();
    }

    ctx.restore();
}
