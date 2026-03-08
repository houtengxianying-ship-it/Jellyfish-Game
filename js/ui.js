// UI rendering
const UI = {
    mergeEffects: [],
    scorePopups: [],
    comboDisplay: { count: 0, startTime: 0, duration: 1200 },

    // --- Frosted glass panel helper ---
    drawFrostedPanel: function (ctx, x, y, w, h, cornerRadius) {
        cornerRadius = cornerRadius || 10;
        ctx.save();

        // Background fill
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, cornerRadius);
        ctx.fillStyle = 'rgba(10, 40, 80, 0.45)';
        ctx.fill();

        // Top highlight gradient
        var hlGrad = ctx.createLinearGradient(x, y, x, y + h * 0.4);
        hlGrad.addColorStop(0, 'rgba(160, 220, 255, 0.12)');
        hlGrad.addColorStop(1, 'rgba(160, 220, 255, 0.0)');
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, cornerRadius);
        ctx.fillStyle = hlGrad;
        ctx.fill();

        // Border
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, cornerRadius);
        ctx.strokeStyle = 'rgba(120, 200, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    },

    // --- Score display ---
    drawScore: function (ctx, displayScore, scoreScale) {
        scoreScale = scoreScale || 1.0;
        var px = 12, py = 10, pw = 115, ph = 58;
        this.drawFrostedPanel(ctx, px, py, pw, ph);

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 3;

        // Label
        ctx.fillStyle = 'rgba(160, 210, 255, 0.7)';
        ctx.font = '11px "Helvetica Neue", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('SCORE', px + 12, py + 18);

        // Value with scale animation
        ctx.font = 'bold 26px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        if (scoreScale !== 1.0) {
            var cx = px + 12;
            var cy = py + 44;
            ctx.translate(cx, cy);
            ctx.scale(scoreScale, scoreScale);
            ctx.translate(-cx, -cy);
        }
        ctx.fillText(Math.floor(displayScore), px + 12, py + 44);
        ctx.restore();
    },

    // --- Next preview ---
    drawNextPreview: function (ctx, nextType) {
        if (!nextType) return;

        var px = 340, py = 10, pw = 68, ph = 70;
        this.drawFrostedPanel(ctx, px, py, pw, ph);

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 3;
        ctx.fillStyle = 'rgba(160, 210, 255, 0.7)';
        ctx.font = '11px "Helvetica Neue", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NEXT', px + pw / 2, py + 17);
        ctx.restore();

        var previewRadius = JELLYFISH_TYPES[nextType].radius * 0.55;
        drawJellyfish(ctx, px + pw / 2, py + 45, previewRadius, nextType, 0.85);
    },

    // --- Danger line ---
    drawDangerLine: function (ctx, dangerY, dangerLevel) {
        dangerLevel = dangerLevel || 0;
        ctx.save();

        var time = Date.now() * 0.001;
        var baseAlpha = 0.2 + dangerLevel * 0.5;
        var pulse = dangerLevel > 0 ? (0.5 + 0.5 * Math.sin(time * 4)) : 0;

        // Red glow zone above line when in danger
        if (dangerLevel > 0.1) {
            var glowAlpha = dangerLevel * 0.08 * (0.7 + 0.3 * pulse);
            var glowGrad = ctx.createLinearGradient(0, dangerY - 40, 0, dangerY + 20);
            glowGrad.addColorStop(0, 'rgba(255, 50, 50, 0)');
            glowGrad.addColorStop(0.5, 'rgba(255, 50, 50, ' + glowAlpha + ')');
            glowGrad.addColorStop(1, 'rgba(255, 50, 50, 0)');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(Physics.WALL_THICKNESS, dangerY - 40, Physics.CANVAS_WIDTH - Physics.WALL_THICKNESS * 2, 60);
        }

        // Dashed line with animated offset
        var r = Math.floor(255 - dangerLevel * 80);
        var g = Math.floor(80 - dangerLevel * 60);
        var b = Math.floor(80 - dangerLevel * 40);
        ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + baseAlpha + ')';
        ctx.lineWidth = 1.5 + dangerLevel;
        ctx.setLineDash([8, 6]);
        if (dangerLevel > 0) {
            ctx.lineDashOffset = -time * 30;
        }
        ctx.beginPath();
        ctx.moveTo(Physics.WALL_THICKNESS, dangerY);
        ctx.lineTo(Physics.CANVAS_WIDTH - Physics.WALL_THICKNESS, dangerY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    },

    // --- Walls ---
    drawWalls: function (ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.2)';
        ctx.lineWidth = 2;

        var t = Physics.WALL_THICKNESS;
        var w = Physics.CANVAS_WIDTH;
        var h = Physics.CANVAS_HEIGHT;

        ctx.beginPath();
        ctx.moveTo(t, 0);
        ctx.lineTo(t, h - t);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w - t, 0);
        ctx.lineTo(w - t, h - t);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(t, h - t);
        ctx.lineTo(w - t, h - t);
        ctx.stroke();

        ctx.restore();
    },

    // --- Game Over (phased animation) ---
    drawGameOver: function (ctx, canvas, score, highScore, isNewHighScore, elapsed) {
        elapsed = elapsed || 2000;
        ctx.save();

        // Phase 1: overlay fade-in (0-400ms)
        var overlayAlpha = Math.min(1, elapsed / 400) * 0.7;
        ctx.fillStyle = 'rgba(0, 0, 20, ' + overlayAlpha + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';

        // Phase 2: GAME OVER text (400ms+)
        if (elapsed > 400) {
            var textProgress = Math.min(1, (elapsed - 400) / 400);
            var eased = 1 - Math.pow(1 - textProgress, 3); // easeOutCubic
            var scale = 1 + (1 - eased) * 1.2;

            ctx.save();
            var cx = canvas.width / 2;
            var cy = canvas.height / 2 - 50;
            ctx.translate(cx, cy);
            ctx.scale(scale, scale);
            ctx.translate(-cx, -cy);

            ctx.globalAlpha = eased;
            ctx.shadowColor = 'rgba(255, 80, 120, 0.6)';
            ctx.shadowBlur = 20;
            ctx.font = 'bold 40px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = '#FF6B8A';
            ctx.fillText('GAME OVER', cx, cy);
            ctx.restore();
        }

        // Phase 3: score reveal (800ms+)
        if (elapsed > 800) {
            var scoreProgress = Math.min(1, (elapsed - 800) / 400);
            var scoreEased = 1 - Math.pow(1 - scoreProgress, 2);
            var displayedScore = Math.floor(score * scoreEased);

            ctx.globalAlpha = scoreEased;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.font = '16px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
            ctx.fillText('SCORE', canvas.width / 2, canvas.height / 2 + 5);

            ctx.font = 'bold 38px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(displayedScore, canvas.width / 2, canvas.height / 2 + 48);

            // NEW BEST!
            if (isNewHighScore && scoreProgress > 0.5) {
                var bestAlpha = Math.min(1, (scoreProgress - 0.5) * 2);
                var time = Date.now() * 0.001;
                var glow = 0.8 + 0.2 * Math.sin(time * 3);
                ctx.globalAlpha = bestAlpha * glow;
                ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
                ctx.shadowBlur = 15;
                ctx.font = 'bold 20px "Helvetica Neue", Arial, sans-serif';
                ctx.fillStyle = '#FFD700';
                ctx.fillText('NEW BEST!', canvas.width / 2, canvas.height / 2 + 78);
            }
        }

        // Phase 4: high score + retry (1200ms+)
        if (elapsed > 1200) {
            var retryProgress = Math.min(1, (elapsed - 1200) / 400);
            var time = Date.now() * 0.001;

            // Best score
            if (highScore > 0 && !isNewHighScore) {
                ctx.globalAlpha = retryProgress * 0.6;
                ctx.shadowBlur = 0;
                ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
                ctx.fillStyle = 'rgba(160, 200, 255, 0.7)';
                ctx.fillText('BEST: ' + highScore, canvas.width / 2, canvas.height / 2 + 80);
            }

            // TAP TO RETRY pulse
            var retryY = isNewHighScore ? canvas.height / 2 + 115 : canvas.height / 2 + 110;
            var retryAlpha = retryProgress * (0.4 + 0.3 * Math.sin(time * 2.5));
            ctx.globalAlpha = retryAlpha;
            ctx.shadowBlur = 0;
            ctx.font = '15px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
            ctx.fillText('TAP TO RETRY', canvas.width / 2, retryY);
        }

        ctx.restore();
    },

    // --- Title screen ---
    drawTitleScreen: function (ctx, canvas, highScore) {
        var time = Date.now() * 0.001;

        ctx.save();
        ctx.textAlign = 'center';

        // Title text with gradient
        ctx.shadowColor = 'rgba(80, 180, 255, 0.5)';
        ctx.shadowBlur = 20;
        ctx.font = 'bold 42px "Helvetica Neue", Arial, sans-serif';
        var titleGrad = ctx.createLinearGradient(canvas.width / 2 - 120, 0, canvas.width / 2 + 120, 0);
        titleGrad.addColorStop(0, '#80D0FF');
        titleGrad.addColorStop(0.5, '#FFFFFF');
        titleGrad.addColorStop(1, '#80D0FF');
        ctx.fillStyle = titleGrad;
        ctx.fillText('KURAGE GAME', canvas.width / 2, canvas.height / 2 - 80);

        // Subtitle
        ctx.shadowBlur = 0;
        ctx.font = '16px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = 'rgba(160, 210, 255, 0.6)';
        ctx.fillText('- deep sea jellyfish drop -', canvas.width / 2, canvas.height / 2 - 48);

        // Decorative jellyfish
        var jellyY = canvas.height / 2 + 20 + Math.sin(time * 1.2) * 8;
        drawJellyfish(ctx, canvas.width / 2, jellyY, 40, 5, 0.7);

        // High score
        if (highScore > 0) {
            ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = 'rgba(160, 200, 255, 0.5)';
            ctx.fillText('BEST: ' + highScore, canvas.width / 2, canvas.height / 2 + 100);
        }

        // TAP TO START pulse
        var startAlpha = 0.4 + 0.35 * Math.sin(time * 2.5);
        ctx.globalAlpha = startAlpha;
        ctx.font = '16px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = 'rgba(200, 230, 255, 0.9)';
        ctx.fillText('TAP TO START', canvas.width / 2, canvas.height / 2 + 150);

        ctx.restore();
    },

    // --- Merge effects (enhanced) ---
    addMergeEffect: function (x, y, radius, color) {
        this.mergeEffects.push({
            x: x,
            y: y,
            radius: radius,
            color: color || '#AAD4FF',
            startTime: Date.now(),
            duration: 500,
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
            var expandRadius = e.radius * (1 + progress * 1.8);

            ctx.save();

            // Flash at merge point (first 100ms)
            if (elapsed < 120) {
                var flashAlpha = (1 - elapsed / 120) * 0.6;
                ctx.globalAlpha = flashAlpha;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.radius * 0.6 * (1 - elapsed / 120), 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = alpha * 0.5;

            // Primary ring
            ctx.strokeStyle = e.color;
            ctx.lineWidth = 2.5 * (1 - progress);
            ctx.beginPath();
            ctx.arc(e.x, e.y, expandRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Secondary ring (slower)
            ctx.globalAlpha = alpha * 0.3;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5 * (1 - progress);
            ctx.beginPath();
            ctx.arc(e.x, e.y, expandRadius * 0.7, 0, Math.PI * 2);
            ctx.stroke();

            // Particles (10, colored)
            var particleCount = 10;
            ctx.globalAlpha = alpha * 0.7;
            for (var j = 0; j < particleCount; j++) {
                var angle = (Math.PI * 2 / particleCount) * j + progress * 0.5;
                var dist = expandRadius * (0.6 + Math.sin(j * 1.3) * 0.2);
                var px = e.x + Math.cos(angle) * dist;
                var py = e.y + Math.sin(angle) * dist;
                var pSize = (2.5 - progress * 2) * (0.8 + Math.sin(j) * 0.3);
                if (pSize > 0.3) {
                    ctx.fillStyle = j % 3 === 0 ? '#FFFFFF' : e.color;
                    ctx.beginPath();
                    ctx.arc(px, py, pSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }
    },

    // --- Score popups (+N floating text) ---
    addScorePopup: function (x, y, score, name, color) {
        this.scorePopups.push({
            x: x,
            y: y,
            score: score,
            name: name || '',
            color: color || '#FFFFFF',
            startTime: Date.now(),
            duration: 900,
        });
    },

    drawScorePopups: function (ctx) {
        var now = Date.now();
        for (var i = this.scorePopups.length - 1; i >= 0; i--) {
            var p = this.scorePopups[i];
            var elapsed = now - p.startTime;
            if (elapsed > p.duration) {
                this.scorePopups.splice(i, 1);
                continue;
            }
            var progress = elapsed / p.duration;
            var alpha = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
            var yOffset = -progress * 50;
            var scale = progress < 0.15 ? 0.5 + (progress / 0.15) * 0.5 : 1.0;

            ctx.save();
            ctx.globalAlpha = alpha;

            var drawY = p.y + yOffset;
            var fontSize = Math.min(24, 15 + p.score * 0.15);

            // Score text with outline (high contrast per accessibility guidelines)
            ctx.font = 'bold ' + Math.floor(fontSize * scale) + 'px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 4;
            ctx.lineJoin = 'round';
            ctx.strokeText('+' + p.score, p.x, drawY);
            ctx.fillStyle = p.color;
            ctx.fillText('+' + p.score, p.x, drawY);

            // Name (smaller, fades faster)
            if (p.name && progress < 0.5) {
                ctx.globalAlpha = alpha * (1 - progress * 2) * 0.6;
                ctx.font = '10px "Helvetica Neue", Arial, sans-serif';
                ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
                ctx.fillText(p.name, p.x, drawY + 14);
            }

            ctx.restore();
        }
    },

    // --- Combo display ---
    showCombo: function (count) {
        this.comboDisplay.count = count;
        this.comboDisplay.startTime = Date.now();
    },

    // --- Ranking Button (Title Screen) ---
    drawRankingButton: function (ctx, canvas, highScore) {
        if (highScore <= 0) return null;

        var btnX = canvas.width / 2 - 50;
        var btnY = canvas.height / 2 + 180;
        var btnW = 100;
        var btnH = 32;

        this.drawFrostedPanel(ctx, btnX, btnY, btnW, btnH, 8);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '13px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
        ctx.fillText('RANKING', btnX + btnW / 2, btnY + btnH / 2);
        ctx.restore();

        return { x: btnX, y: btnY, w: btnW, h: btnH };
    },

    // --- Ranking Panel ---
    drawRankingPanel: function (ctx, canvas, rankings, isLoading, errorMessage, selfScore) {
        ctx.save();

        // Overlay
        ctx.fillStyle = 'rgba(0, 10, 30, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Panel
        var panelW = 320;
        var panelH = 420;
        var panelX = (canvas.width - panelW) / 2;
        var panelY = (canvas.height - panelH) / 2;
        this.drawFrostedPanel(ctx, panelX, panelY, panelW, panelH, 12);

        // Title
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(80, 180, 255, 0.5)';
        ctx.shadowBlur = 10;
        ctx.font = 'bold 22px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = '#80D0FF';
        ctx.fillText('RANKING', canvas.width / 2, panelY + 35);

        // Close hint
        ctx.shadowBlur = 0;
        ctx.font = '11px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = 'rgba(160, 200, 255, 0.5)';
        ctx.fillText('TAP TO CLOSE', canvas.width / 2, panelY + 55);

        // Content
        var contentY = panelY + 75;

        if (isLoading) {
            ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = 'rgba(200, 220, 255, 0.7)';
            ctx.fillText('Loading...', canvas.width / 2, contentY + 60);
        } else if (errorMessage) {
            ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.fillText(errorMessage, canvas.width / 2, contentY + 60);
        } else if (rankings && rankings.length > 0) {
            // Header
            ctx.textAlign = 'left';
            ctx.font = '11px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = 'rgba(120, 180, 220, 0.6)';
            ctx.fillText('RANK', panelX + 20, contentY + 15);
            ctx.fillText('NAME', panelX + 60, contentY + 15);
            ctx.textAlign = 'right';
            ctx.fillText('SCORE', panelX + panelW - 20, contentY + 15);

            // Divider
            ctx.strokeStyle = 'rgba(100, 180, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(panelX + 15, contentY + 25);
            ctx.lineTo(panelX + panelW - 15, contentY + 25);
            ctx.stroke();

            // Rankings
            var rowH = 28;
            for (var i = 0; i < rankings.length; i++) {
                var r = rankings[i];
                var rowY = contentY + 30 + i * rowH;
                var isSelf = selfScore && r.score === selfScore && r.playerName === Ranking.getLastPlayerName();

                // Highlight self row
                if (isSelf) {
                    ctx.fillStyle = 'rgba(80, 180, 255, 0.15)';
                    ctx.fillRect(panelX + 10, rowY - 2, panelW - 20, rowH - 4);
                }

                // Rank number
                ctx.textAlign = 'left';
                ctx.font = (i < 3 ? 'bold ' : '') + '13px "Helvetica Neue", Arial, sans-serif';
                if (i === 0) ctx.fillStyle = '#FFD700';
                else if (i === 1) ctx.fillStyle = '#C0C0C0';
                else if (i === 2) ctx.fillStyle = '#CD7F32';
                else ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
                ctx.fillText((i + 1) + '.', panelX + 22, rowY + 12);

                // Name
                ctx.fillStyle = isSelf ? '#80D0FF' : 'rgba(255, 255, 255, 0.9)';
                ctx.fillText(r.playerName, panelX + 55, rowY + 12);

                // Score
                ctx.textAlign = 'right';
                ctx.font = 'bold 13px "Helvetica Neue", Arial, sans-serif';
                ctx.fillStyle = isSelf ? '#80D0FF' : 'rgba(255, 255, 255, 0.9)';
                ctx.fillText(r.score, panelX + panelW - 20, rowY + 12);
            }
        } else {
            ctx.textAlign = 'center';
            ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = 'rgba(200, 220, 255, 0.6)';
            ctx.fillText('No records yet', canvas.width / 2, contentY + 60);
            ctx.fillText('Be the first to register!', canvas.width / 2, contentY + 82);
        }

        ctx.restore();

        return { x: panelX, y: panelY, w: panelW, h: panelH };
    },

    // --- Name Input Dialog ---
    drawNameInputDialog: function (ctx, canvas, inputValue, pendingScore, errorMessage) {
        ctx.save();

        // Overlay
        ctx.fillStyle = 'rgba(0, 10, 30, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dialog
        var dlgW = 280;
        var dlgH = 200;
        var dlgX = (canvas.width - dlgW) / 2;
        var dlgY = (canvas.height - dlgH) / 2;
        this.drawFrostedPanel(ctx, dlgX, dlgY, dlgW, dlgH, 12);

        // Title
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(80, 180, 255, 0.5)';
        ctx.shadowBlur = 8;
        ctx.font = 'bold 18px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = '#80D0FF';
        ctx.fillText('REGISTER SCORE', canvas.width / 2, dlgY + 30);

        // Score
        ctx.shadowBlur = 0;
        ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = 'rgba(200, 220, 255, 0.7)';
        ctx.fillText('Your Score', canvas.width / 2, dlgY + 55);
        ctx.font = 'bold 26px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(pendingScore, canvas.width / 2, dlgY + 82);

        // Input label
        ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = 'rgba(200, 220, 255, 0.7)';
        ctx.fillText('Enter your name', canvas.width / 2, dlgY + 108);

        // Input field visual
        var inputX = dlgX + 30;
        var inputY = dlgY + 115;
        var inputW = dlgW - 60;
        var inputH = 32;

        ctx.fillStyle = 'rgba(0, 20, 50, 0.6)';
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(inputX, inputY, inputW, inputH, 6);
        ctx.fill();
        ctx.stroke();

        // Input text
        ctx.textAlign = 'left';
        ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        var displayText = inputValue || '';
        // Truncate display if too long
        while (ctx.measureText(displayText).width > inputW - 20 && displayText.length > 0) {
            displayText = displayText.substring(0, displayText.length - 1);
        }
        ctx.fillText(displayText, inputX + 10, inputY + 21);

        // Cursor blink
        var cursorVisible = Math.floor(Date.now() / 500) % 2 === 0;
        if (cursorVisible) {
            var cursorX = inputX + 10 + ctx.measureText(displayText).width + 1;
            ctx.fillStyle = '#80D0FF';
            ctx.fillRect(cursorX, inputY + 8, 1.5, 16);
        }

        // Error message
        if (errorMessage) {
            ctx.textAlign = 'center';
            ctx.font = '11px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
            ctx.fillText(errorMessage, canvas.width / 2, dlgY + 162);
        }

        // Submit button
        var btnY = dlgY + (errorMessage ? 170 : 155);
        var btnW = 80;
        var btnH = 28;
        var btnX = (canvas.width - btnW) / 2;

        ctx.fillStyle = 'rgba(80, 180, 255, 0.3)';
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 12px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('SUBMIT', btnX + btnW / 2, btnY + btnH / 2);

        ctx.restore();

        return {
            dialog: { x: dlgX, y: dlgY, w: dlgW, h: dlgH },
            input: { x: inputX, y: inputY, w: inputW, h: inputH },
            submitBtn: { x: btnX, y: btnY, w: btnW, h: btnH }
        };
    },

    // --- Game Over with Ranking Button ---
    drawGameOverWithRanking: function (ctx, canvas, score, highScore, isNewHighScore, elapsed, rankingBtnBounds) {
        // Draw base game over
        this.drawGameOver(ctx, canvas, score, highScore, isNewHighScore, elapsed);

        // Draw RANKING button (after retry hint)
        if (elapsed > 1800 && score > 0) {
            var btnX = canvas.width / 2 - 55;
            var btnY = canvas.height / 2 + 145;
            var btnW = 110;
            var btnH = 32;

            ctx.save();
            this.drawFrostedPanel(ctx, btnX, btnY, btnW, btnH, 8);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 13px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
            ctx.fillText('RANKING', btnX + btnW / 2, btnY + btnH / 2);
            ctx.restore();

            if (rankingBtnBounds) {
                rankingBtnBounds.x = btnX;
                rankingBtnBounds.y = btnY;
                rankingBtnBounds.w = btnW;
                rankingBtnBounds.h = btnH;
            }
        }
    },

    drawCombo: function (ctx, canvasWidth) {
        if (this.comboDisplay.count < 2) return;
        var elapsed = Date.now() - this.comboDisplay.startTime;
        if (elapsed > this.comboDisplay.duration) {
            this.comboDisplay.count = 0;
            return;
        }

        var progress = elapsed / this.comboDisplay.duration;

        // Bounce-in then fade-out
        var scale, alpha;
        if (progress < 0.15) {
            // Bounce in
            var t = progress / 0.15;
            scale = 0.3 + t * 0.9; // overshoot to 1.2
            alpha = t;
        } else if (progress < 0.25) {
            // Settle
            var t = (progress - 0.15) / 0.1;
            scale = 1.2 - t * 0.2;
            alpha = 1;
        } else if (progress < 0.7) {
            scale = 1.0;
            alpha = 1;
        } else {
            // Fade out
            var t = (progress - 0.7) / 0.3;
            scale = 1.0;
            alpha = 1 - t;
        }

        var count = this.comboDisplay.count;
        var fontSize = Math.min(32, 20 + count * 2);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';

        var cx = canvasWidth / 2;
        var cy = 88;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        // Glow
        ctx.shadowColor = count >= 5 ? 'rgba(255, 215, 0, 0.8)' : 'rgba(0, 220, 255, 0.6)';
        ctx.shadowBlur = 12 + count * 2;

        ctx.font = 'bold ' + fontSize + 'px "Helvetica Neue", Arial, sans-serif';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 3;
        var text = 'COMBO x' + count + '!';
        ctx.strokeText(text, cx, cy);
        ctx.fillStyle = count >= 5 ? '#FFD700' : '#00E0FF';
        ctx.fillText(text, cx, cy);

        ctx.restore();
    },
};
