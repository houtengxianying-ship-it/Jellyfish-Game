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
    var jelly = JELLYFISH_TYPES[type];
    if (!jelly) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    drawJellyfishBody(ctx, x, y, radius, type);
    ctx.restore();
}

// --- Pulsing animation ---
function getPulse(type) {
    var time = Date.now() * 0.001;
    var speed = 1.5 + (type % 3) * 0.4;
    var amount = 0.04 + (type % 4) * 0.012;
    return 1.0 + Math.sin(time * speed + type * 1.7) * amount;
}

// --- Color helpers ---
function lightenColor(hex, amount) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function darkenColor(hex, amount) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// --- Main body renderer ---
function drawJellyfishBody(ctx, x, y, radius, type) {
    var jelly = JELLYFISH_TYPES[type];
    var time = Date.now() * 0.001;
    var pulse = getPulse(type);

    // Bell dimensions
    var bellW = radius * 0.58 * pulse;
    var bellH = radius * 0.55 * pulse;
    var bellY = y - radius * 0.08;

    // Shape-specific dimension tweaks
    switch (jelly.shape) {
        case 'flat': case 'disc': bellW *= 1.2; bellH *= 0.7; break;
        case 'tall': bellW *= 0.72; bellH *= 1.18; break;
        case 'helmet': bellW *= 1.08; bellH *= 1.1; break;
        case 'bulb': bellW *= 1.1; bellH *= 1.05; break;
        case 'giant': bellW *= 1.15; bellH *= 1.05; break;
    }

    // --- Tentacles (drawn behind bell) ---
    drawTentacles(ctx, x, bellY, bellW, bellH, radius, type, jelly, time);

    // --- Bell with glow shadow ---
    ctx.save();
    var glowPulse = 0.45 + Math.sin(time * 2 + type) * 0.15;
    ctx.shadowBlur = radius * glowPulse * 0.6;
    ctx.shadowColor = jelly.bodyColor + '66';

    drawBellShape(ctx, x, bellY, bellW, bellH, jelly.shape, type, time);

    // Rich 4-stop gradient with offset light source
    var grad = ctx.createRadialGradient(
        x - bellW * 0.15, bellY - bellH * 0.4, bellW * 0.1,
        x, bellY + bellH * 0.1, Math.max(bellW, bellH) * 1.1
    );
    grad.addColorStop(0, lightenColor(jelly.bodyColor, 60) + 'FF');
    grad.addColorStop(0.35, jelly.bodyColor + 'EE');
    grad.addColorStop(0.7, jelly.bodyColor + 'BB');
    grad.addColorStop(1, darkenColor(jelly.bodyColor, 30) + '88');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = jelly.bodyColor + '66';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // --- Crescent highlight ---
    drawHighlight(ctx, x, bellY, bellW, bellH, jelly.shape);

    // --- Inner patterns ---
    drawInnerPattern(ctx, x, bellY, bellW, bellH, type, jelly, time);

    // --- Frilly edge ---
    drawFrillyEdge(ctx, x, bellY, bellW, bellH, type, jelly, time);

    // --- Cute eyes ---
    drawEyes(ctx, x, bellY, bellW, bellH, type, jelly, time);
}

// --- Bell shapes ---
function drawBellShape(ctx, x, bellY, bellW, bellH, shape, type, time) {
    ctx.beginPath();

    switch (shape) {
        case 'flat':
            // Wide mushroom cap
            ctx.moveTo(x - bellW, bellY + bellH * 0.05);
            ctx.bezierCurveTo(
                x - bellW, bellY - bellH * 0.9,
                x + bellW, bellY - bellH * 0.9,
                x + bellW, bellY + bellH * 0.05
            );
            ctx.quadraticCurveTo(x + bellW * 0.5, bellY + bellH * 0.45, x, bellY + bellH * 0.3);
            ctx.quadraticCurveTo(x - bellW * 0.5, bellY + bellH * 0.45, x - bellW, bellY + bellH * 0.05);
            break;

        case 'tall':
            // Elegant elongated bell
            ctx.moveTo(x, bellY - bellH * 1.1);
            ctx.bezierCurveTo(
                x + bellW * 0.9, bellY - bellH * 1.1,
                x + bellW, bellY - bellH * 0.2,
                x + bellW * 0.7, bellY + bellH * 0.1
            );
            ctx.quadraticCurveTo(x + bellW * 0.35, bellY + bellH * 0.4, x, bellY + bellH * 0.25);
            ctx.quadraticCurveTo(x - bellW * 0.35, bellY + bellH * 0.4, x - bellW * 0.7, bellY + bellH * 0.1);
            ctx.bezierCurveTo(
                x - bellW, bellY - bellH * 0.2,
                x - bellW * 0.9, bellY - bellH * 1.1,
                x, bellY - bellH * 1.1
            );
            break;

        case 'dome':
            // Smooth rounded dome
            ctx.arc(x, bellY, bellW, Math.PI, 0);
            ctx.bezierCurveTo(
                x + bellW * 0.7, bellY + bellH * 0.5,
                x - bellW * 0.7, bellY + bellH * 0.5,
                x - bellW, bellY
            );
            break;

        case 'disc':
            // Flat umbrella (ミズクラゲ)
            ctx.ellipse(x, bellY - bellH * 0.15, bellW, bellH * 0.55, 0, Math.PI, 0);
            ctx.bezierCurveTo(
                x + bellW * 0.7, bellY + bellH * 0.4,
                x - bellW * 0.7, bellY + bellH * 0.4,
                x - bellW, bellY - bellH * 0.15
            );
            break;

        case 'helmet':
            // Smooth helmet with pointed top
            ctx.moveTo(x - bellW, bellY + bellH * 0.05);
            ctx.bezierCurveTo(
                x - bellW * 1.05, bellY - bellH * 0.5,
                x - bellW * 0.6, bellY - bellH * 1.2,
                x, bellY - bellH * 1.15
            );
            ctx.bezierCurveTo(
                x + bellW * 0.6, bellY - bellH * 1.2,
                x + bellW * 1.05, bellY - bellH * 0.5,
                x + bellW, bellY + bellH * 0.05
            );
            ctx.quadraticCurveTo(x + bellW * 0.4, bellY + bellH * 0.35, x, bellY + bellH * 0.2);
            ctx.quadraticCurveTo(x - bellW * 0.4, bellY + bellH * 0.35, x - bellW, bellY + bellH * 0.05);
            break;

        case 'ruffle':
            // Bell with wavy undulating rim
            ctx.moveTo(x - bellW, bellY);
            ctx.bezierCurveTo(
                x - bellW, bellY - bellH * 1.3,
                x + bellW, bellY - bellH * 1.3,
                x + bellW, bellY
            );
            var lobes = 7;
            for (var i = 0; i <= lobes; i++) {
                var t = i / lobes;
                var lx = x + bellW - bellW * 2 * t;
                var depth = (i % 2 === 0) ? bellH * 0.3 : bellH * 0.1;
                depth += Math.sin(time * 2.5 + i * 1.3) * bellH * 0.06;
                ctx.lineTo(lx, bellY + depth);
            }
            break;

        case 'bulb':
            // Round pear-shaped body
            ctx.moveTo(x, bellY - bellH * 0.95);
            ctx.bezierCurveTo(
                x + bellW * 0.8, bellY - bellH * 0.95,
                x + bellW * 1.1, bellY - bellH * 0.1,
                x + bellW * 0.95, bellY + bellH * 0.2
            );
            ctx.bezierCurveTo(
                x + bellW * 0.8, bellY + bellH * 0.7,
                x + bellW * 0.3, bellY + bellH * 0.85,
                x, bellY + bellH * 0.75
            );
            ctx.bezierCurveTo(
                x - bellW * 0.3, bellY + bellH * 0.85,
                x - bellW * 0.8, bellY + bellH * 0.7,
                x - bellW * 0.95, bellY + bellH * 0.2
            );
            ctx.bezierCurveTo(
                x - bellW * 1.1, bellY - bellH * 0.1,
                x - bellW * 0.8, bellY - bellH * 0.95,
                x, bellY - bellH * 0.95
            );
            break;

        case 'flower':
            // Flower-petaled bell
            var petals = 6;
            ctx.arc(x, bellY - bellH * 0.15, bellW * 0.85, Math.PI, 0);
            for (var p = 0; p < petals; p++) {
                var pt = p / petals;
                var px1 = x + bellW * 0.85 - bellW * 1.7 * pt;
                var px2 = x + bellW * 0.85 - bellW * 1.7 * ((p + 1) / petals);
                var petalDepth = bellH * 0.3 + Math.sin(time * 2 + p * 1.5) * bellH * 0.06;
                var midX = (px1 + px2) / 2;
                ctx.quadraticCurveTo(midX, bellY + petalDepth, px2, bellY + bellH * 0.05);
            }
            break;

        case 'bowl':
            // Open cup shape (オワンクラゲ)
            ctx.moveTo(x - bellW * 0.75, bellY - bellH * 0.5);
            ctx.bezierCurveTo(
                x - bellW * 0.85, bellY - bellH * 1.1,
                x + bellW * 0.85, bellY - bellH * 1.1,
                x + bellW * 0.75, bellY - bellH * 0.5
            );
            ctx.bezierCurveTo(
                x + bellW * 1.0, bellY + bellH * 0.1,
                x + bellW * 0.85, bellY + bellH * 0.6,
                x, bellY + bellH * 0.5
            );
            ctx.bezierCurveTo(
                x - bellW * 0.85, bellY + bellH * 0.6,
                x - bellW * 1.0, bellY + bellH * 0.1,
                x - bellW * 0.75, bellY - bellH * 0.5
            );
            break;

        case 'giant':
            // Massive flowing dome
            var wobble = Math.sin(time * 1.2) * bellW * 0.02;
            ctx.arc(x + wobble, bellY, bellW, Math.PI, 0);
            var segs = 8;
            for (var s = 0; s <= segs; s++) {
                var st = s / segs;
                var sx = x + bellW - bellW * 2 * st + wobble;
                var sy = bellY + bellH * 0.25 + Math.sin(time * 1.5 + s * 1.3) * bellH * 0.1;
                if (s === 0) {
                    ctx.lineTo(sx, sy);
                } else {
                    var prevX = x + bellW - bellW * 2 * ((s - 1) / segs) + wobble;
                    ctx.quadraticCurveTo((prevX + sx) / 2, sy + bellH * 0.08, sx, sy);
                }
            }
            ctx.closePath();
            break;

        default: // 'round'
            ctx.arc(x, bellY, bellW, Math.PI, 0);
            ctx.quadraticCurveTo(x + bellW * 0.6, bellY + bellH * 0.4, x, bellY + bellH * 0.25);
            ctx.quadraticCurveTo(x - bellW * 0.6, bellY + bellH * 0.4, x - bellW, bellY);
            break;
    }

    ctx.closePath();
}

// --- Crescent highlight for 3D look ---
function drawHighlight(ctx, x, bellY, bellW, bellH, shape) {
    ctx.save();

    var hlX = x - bellW * 0.25;
    var hlY = bellY - bellH * 0.35;
    var hlW = bellW * 0.5;
    var hlH = bellH * 0.35;

    if (shape === 'flat' || shape === 'disc') {
        hlY = bellY - bellH * 0.3;
        hlW = bellW * 0.55;
        hlH = bellH * 0.25;
    } else if (shape === 'tall') {
        hlY = bellY - bellH * 0.6;
        hlW = bellW * 0.4;
        hlH = bellH * 0.3;
    }

    // Main crescent glow
    ctx.globalAlpha = 0.35;
    var hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, Math.max(hlW, hlH));
    hlGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    hlGrad.addColorStop(0.5, 'rgba(255,255,255,0.3)');
    hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.ellipse(hlX, hlY, hlW, hlH, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Small bright spot
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(hlX + hlW * 0.15, hlY - hlH * 0.1, Math.max(1.5, hlW * 0.12), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// --- Cute eyes ---
function drawEyes(ctx, x, bellY, bellW, bellH, type, jelly, time) {
    ctx.save();

    var eyeSpacing = bellW * 0.3;
    var eyeY = bellY - bellH * 0.05;
    var eyeSize = Math.max(1.8, bellW * 0.1);

    // Adjust per shape
    switch (jelly.shape) {
        case 'tall':
            eyeY = bellY - bellH * 0.3;
            eyeSpacing = bellW * 0.25;
            break;
        case 'flat': case 'disc':
            eyeY = bellY - bellH * 0.15;
            eyeSpacing = bellW * 0.35;
            break;
        case 'bulb': case 'giant':
            eyeY = bellY - bellH * 0.15;
            eyeSpacing = bellW * 0.25;
            break;
        case 'bowl':
            eyeY = bellY - bellH * 0.35;
            break;
    }

    // Eye whites
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.ellipse(x - eyeSpacing, eyeY, eyeSize * 1.2, eyeSize, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + eyeSpacing, eyeY, eyeSize * 1.2, eyeSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (gentle sway)
    var lookX = Math.sin(time * 0.8) * eyeSize * 0.12;
    var lookY = eyeSize * 0.08;
    var pupilSize = eyeSize * 0.6;
    ctx.fillStyle = darkenColor(jelly.bodyColor, 80);
    ctx.beginPath();
    ctx.arc(x - eyeSpacing + lookX, eyeY + lookY, pupilSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + eyeSpacing + lookX, eyeY + lookY, pupilSize, 0, Math.PI * 2);
    ctx.fill();

    // Pupil highlights
    var dotSize = Math.max(0.8, pupilSize * 0.4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(x - eyeSpacing + lookX - pupilSize * 0.2, eyeY + lookY - pupilSize * 0.25, dotSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + eyeSpacing + lookX - pupilSize * 0.2, eyeY + lookY - pupilSize * 0.25, dotSize, 0, Math.PI * 2);
    ctx.fill();

    // Cheek blush
    if (bellW > 8) {
        ctx.globalAlpha = 0.2 + Math.sin(time * 1.5 + type) * 0.05;
        var blushR = eyeSize * 0.9;
        ctx.fillStyle = '#FF6088';
        ctx.beginPath();
        ctx.ellipse(x - eyeSpacing - eyeSize * 0.8, eyeY + eyeSize * 1.0, blushR * 1.3, blushR * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + eyeSpacing + eyeSize * 0.8, eyeY + eyeSize * 1.0, blushR * 1.3, blushR * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// --- Inner patterns ---
function drawInnerPattern(ctx, x, bellY, bellW, bellH, type, jelly, time) {
    ctx.save();

    if (jelly.shape === 'disc') {
        // ミズクラゲ: four-leaf clover organs
        ctx.globalAlpha = 0.35 + Math.sin(time * 1.5) * 0.08;
        var organR = bellW * 0.14;
        var organDist = bellW * 0.28;
        for (var i = 0; i < 4; i++) {
            var angle = (Math.PI / 2) * i + Math.PI / 4;
            var ox = x + Math.cos(angle) * organDist;
            var oy = bellY - bellH * 0.05 + Math.sin(angle) * organDist * 0.45;
            ctx.beginPath();
            ctx.ellipse(ox, oy, organR, organR * 0.7, angle, 0, Math.PI * 2);
            ctx.fillStyle = jelly.tentacleColor + 'CC';
            ctx.fill();
        }
    } else if (jelly.shape === 'bowl') {
        // オワンクラゲ: bioluminescent GFP rings
        ctx.globalAlpha = 0.2 + Math.sin(time * 2.5) * 0.12;
        ctx.strokeStyle = '#80FFB0';
        ctx.lineWidth = 1.5;
        for (var r = 0; r < 3; r++) {
            ctx.beginPath();
            ctx.arc(x, bellY - bellH * 0.25, bellW * (0.2 + r * 0.18), 0, Math.PI * 2);
            ctx.stroke();
        }
        // Central glow dot
        ctx.globalAlpha = 0.3 + Math.sin(time * 3) * 0.15;
        var gfpGrad = ctx.createRadialGradient(x, bellY - bellH * 0.25, 0, x, bellY - bellH * 0.25, bellW * 0.15);
        gfpGrad.addColorStop(0, '#B0FFD0');
        gfpGrad.addColorStop(1, '#80FFB000');
        ctx.fillStyle = gfpGrad;
        ctx.beginPath();
        ctx.arc(x, bellY - bellH * 0.25, bellW * 0.15, 0, Math.PI * 2);
        ctx.fill();
    } else if (jelly.shape === 'helmet') {
        // Ridge lines on helmet
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = lightenColor(jelly.bodyColor, 40);
        ctx.lineWidth = 1;
        for (var ri = 0; ri < 3; ri++) {
            var ry = bellY - bellH * (0.3 + ri * 0.25);
            var rw = bellW * (0.8 - ri * 0.15);
            ctx.beginPath();
            ctx.ellipse(x, ry, rw, bellH * 0.08, 0, Math.PI, 0);
            ctx.stroke();
        }
    } else if (jelly.shape === 'flower') {
        // Stamen dots in center
        ctx.globalAlpha = 0.25;
        var dotCount = 5;
        for (var d = 0; d < dotCount; d++) {
            var da = (Math.PI * 2 / dotCount) * d + time * 0.3;
            var dd = bellW * 0.2;
            var dx = x + Math.cos(da) * dd;
            var dy = bellY - bellH * 0.1 + Math.sin(da) * dd * 0.5;
            ctx.fillStyle = lightenColor(jelly.bodyColor, 50);
            ctx.beginPath();
            ctx.arc(dx, dy, bellW * 0.04, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type >= 4) {
        // Subtle spots for larger types
        var spotCount = Math.min(type - 2, 6);
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        for (var s = 0; s < spotCount; s++) {
            var sa = (Math.PI / (spotCount + 1)) * (s + 1);
            var sx = x + Math.cos(sa + Math.PI) * bellW * 0.4;
            var sy = bellY - Math.sin(sa) * bellH * 0.3;
            var sr = bellW * 0.05 + Math.sin(time * 2 + s * 1.5) * bellW * 0.01;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

// --- Tentacles ---
function drawTentacles(ctx, x, bellY, bellW, bellH, radius, type, jelly, time) {
    var tentacleCount = 3 + Math.floor(type * 0.7);
    var tentacleLength = bellH * (0.9 + type * 0.1);
    var startY = bellY + bellH * 0.18;

    ctx.save();
    ctx.lineCap = 'round';

    var isThick = jelly.shape === 'bulb' || jelly.shape === 'giant';
    var baseWidth = isThick ? Math.max(2.5, radius * 0.055) : Math.max(1.5, radius * 0.04);

    for (var i = 0; i < tentacleCount; i++) {
        var t = i / (tentacleCount - 1);
        var spread = (jelly.shape === 'flat' || jelly.shape === 'disc') ? 0.72 : 0.55;
        var tx = x - bellW * spread + bellW * spread * 2 * t;

        var wave1 = Math.sin(time * 2.0 + i * 1.7) * radius * 0.14;
        var wave2 = Math.cos(time * 1.4 + i * 1.3) * radius * 0.1;

        var segments = 4;
        var px = tx, py = startY;

        for (var seg = 0; seg < segments; seg++) {
            var segT = (seg + 1) / segments;
            var segLen = tentacleLength / segments;

            var nx = tx + wave1 * segT + wave2 * segT * segT;
            var ny = py + segLen;
            var cpx = px + wave1 * 0.4 * segT;
            var cpy = py + segLen * 0.55;

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.quadraticCurveTo(cpx, cpy, nx, ny);

            var width = baseWidth * (1.0 - segT * 0.7);
            ctx.lineWidth = Math.max(0.5, width);

            var segAlpha = Math.floor(170 * (1.0 - segT * 0.6));
            var alphaHex = segAlpha.toString(16).padStart(2, '0');
            ctx.strokeStyle = jelly.tentacleColor + alphaHex;
            ctx.stroke();

            px = nx;
            py = ny;
        }
    }

    // Extra oral arms for タコクラゲ/エチゼンクラゲ
    if (isThick) {
        var armCount = jelly.shape === 'giant' ? 5 : 3;
        for (var a = 0; a < armCount; a++) {
            var at = a / (armCount - 1);
            var ax = x - bellW * 0.3 + bellW * 0.6 * at;
            var armLen = tentacleLength * 0.55;
            var aw1 = Math.sin(time * 1.6 + a * 2.3) * radius * 0.12;
            var aw2 = Math.cos(time * 2.1 + a * 1.6) * radius * 0.08;

            ctx.beginPath();
            ctx.moveTo(ax, startY + bellH * 0.05);
            ctx.bezierCurveTo(
                ax + aw1, startY + armLen * 0.35,
                ax + aw2, startY + armLen * 0.7,
                ax + aw1 * 0.4, startY + armLen
            );
            ctx.lineWidth = Math.max(2, radius * 0.035);
            ctx.strokeStyle = jelly.bodyColor + '55';
            ctx.stroke();
        }
    }

    ctx.restore();
}

// --- Frilly edge ---
function drawFrillyEdge(ctx, x, bellY, bellW, bellH, type, jelly, time) {
    ctx.save();

    var frillyCount = 8 + type * 2;
    var edgeY = bellY + bellH * 0.15;
    var spread = (jelly.shape === 'flat' || jelly.shape === 'disc') ? 0.85 : 0.65;

    for (var i = 0; i < frillyCount; i++) {
        var t = i / frillyCount;
        var fx = x - bellW * spread + bellW * spread * 2 * t;
        var wave = Math.sin(time * 2.8 + i * 1.1) * bellH * 0.06;
        var frilLen = bellH * 0.1 + Math.sin(time * 2.2 + i * 1.5) * bellH * 0.03;

        var frilAlpha = 0.3 + Math.sin(time * 2 + i * 0.7) * 0.1;
        ctx.globalAlpha = frilAlpha;
        ctx.strokeStyle = jelly.bodyColor;
        ctx.lineWidth = 0.8;

        ctx.beginPath();
        ctx.moveTo(fx, edgeY + wave * 0.3);
        ctx.quadraticCurveTo(
            fx + wave * 0.6, edgeY + frilLen * 0.5,
            fx + wave, edgeY + frilLen
        );
        ctx.stroke();
    }

    ctx.restore();
}
