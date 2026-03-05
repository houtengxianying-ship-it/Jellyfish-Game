// UI rendering
const UI = {
    mergeEffects: [],

    drawScore: function (ctx, score) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('SCORE', 25, 30);
        ctx.font = 'bold 28px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(score, 25, 60);
        ctx.restore();
    },

    drawNextPreview: function (ctx, nextType) {
        if (!nextType) return;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NEXT', 380, 30);
        ctx.restore();

        var previewRadius = JELLYFISH_TYPES[nextType].radius * 0.6;
        drawJellyfish(ctx, 380, 58, previewRadius, nextType, 0.8);
    },

    drawDangerLine: function (ctx, dangerY) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(Physics.WALL_THICKNESS, dangerY);
        ctx.lineTo(Physics.CANVAS_WIDTH - Physics.WALL_THICKNESS, dangerY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    },

    drawWalls: function (ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.2)';
        ctx.lineWidth = 2;

        var t = Physics.WALL_THICKNESS;
        var w = Physics.CANVAS_WIDTH;
        var h = Physics.CANVAS_HEIGHT;

        // Left wall
        ctx.beginPath();
        ctx.moveTo(t, 0);
        ctx.lineTo(t, h - t);
        ctx.stroke();

        // Right wall
        ctx.beginPath();
        ctx.moveTo(w - t, 0);
        ctx.lineTo(w - t, h - t);
        ctx.stroke();

        // Floor
        ctx.beginPath();
        ctx.moveTo(t, h - t);
        ctx.lineTo(w - t, h - t);
        ctx.stroke();

        ctx.restore();
    },

    drawGameOver: function (ctx, canvas, score) {
        ctx.save();

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 6;

        // GAME OVER text
        ctx.font = 'bold 42px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = '#FF6B8A';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

        // Final score
        ctx.font = '18px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('SCORE', canvas.width / 2, canvas.height / 2 + 10);
        ctx.font = 'bold 36px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(score, canvas.width / 2, canvas.height / 2 + 50);

        // Retry message
        ctx.font = '16px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('TAP TO RETRY', canvas.width / 2, canvas.height / 2 + 100);

        ctx.restore();
    },

    addMergeEffect: function (x, y, radius) {
        this.mergeEffects.push({
            x: x,
            y: y,
            radius: radius,
            startTime: Date.now(),
            duration: 400,
        });
    },

    drawMergeEffects: function (ctx) {
        var now = Date.now();
        for (var i = this.mergeEffects.length - 1; i >= 0; i--) {
            var e = this.mergeEffects[i];
            var elapsed = now - e.startTime;
            if (elapsed > e.duration) {
                this.mergeEffects.splice(i, 1);
                continue;
            }
            var progress = elapsed / e.duration;
            var alpha = 1 - progress;
            var expandRadius = e.radius * (1 + progress * 1.5);

            ctx.save();
            ctx.globalAlpha = alpha * 0.5;

            // Ring effect
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2 * (1 - progress);
            ctx.beginPath();
            ctx.arc(e.x, e.y, expandRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Particles
            var particleCount = 6;
            for (var j = 0; j < particleCount; j++) {
                var angle = (Math.PI * 2 / particleCount) * j;
                var dist = expandRadius * 0.8;
                var px = e.x + Math.cos(angle) * dist;
                var py = e.y + Math.sin(angle) * dist;
                ctx.fillStyle = '#AAD4FF';
                ctx.beginPath();
                ctx.arc(px, py, 2 * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    },
};
