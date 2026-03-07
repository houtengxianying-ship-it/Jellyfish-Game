// Main game controller
const GAME = {
    CANVAS_WIDTH: 420,
    CANVAS_HEIGHT: 640,
    DANGER_Y: 120,
    DROP_Y: 80,
    DROP_COOLDOWN: 500,
};

(function () {
    var canvas = document.getElementById('gameCanvas');
    var ctx = canvas.getContext('2d');

    function getHighScore() {
        try { return parseInt(localStorage.getItem('jellyfish_highscore')) || 0; } catch (e) { return 0; }
    }
    function setHighScore(val) {
        try { localStorage.setItem('jellyfish_highscore', val); } catch (e) {}
    }

    var state = {
        phase: 'title', // 'title' | 'playing' | 'gameover'
        score: 0,
        displayScore: 0,
        targetScore: 0,
        scoreAnimStart: 0,
        gameOver: false,
        gameOverReady: false,
        gameOverStartTime: 0,
        isNewHighScore: false,
        nextType: randomDropType(),
        currentType: randomDropType(),
        cursorX: GAME.CANVAS_WIDTH / 2,
        canDrop: true,
        dangerTimer: 0,
        comboCount: 0,
        lastMergeTime: 0,
    };

    function randomDropType() {
        return Math.floor(Math.random() * 5) + 1;
    }

    function clampX(x, radius) {
        var minX = Physics.WALL_THICKNESS + radius;
        var maxX = GAME.CANVAS_WIDTH - Physics.WALL_THICKNESS - radius;
        return Math.max(minX, Math.min(maxX, x));
    }

    function init() {
        Physics.init();

        Physics.onMerge = function (newType, x, y) {
            var jelly = JELLYFISH_TYPES[newType];
            state.score += jelly.score;

            // Enhanced merge effect with color
            UI.addMergeEffect(x, y, jelly.radius, jelly.bodyColor);

            // Score popup
            UI.addScorePopup(x, y, jelly.score, jelly.name, jelly.bodyColor);

            // Combo tracking
            var now = Date.now();
            if (now - state.lastMergeTime < 1500) {
                state.comboCount++;
            } else {
                state.comboCount = 1;
            }
            state.lastMergeTime = now;
            if (state.comboCount >= 2) {
                UI.showCombo(state.comboCount);
            }
        };

        requestAnimationFrame(gameLoop);
    }

    function drop() {
        if (!state.canDrop || state.gameOver) return;

        var type = state.currentType;
        var radius = JELLYFISH_TYPES[type].radius;
        var x = clampX(state.cursorX, radius);

        Physics.createJellyfish(x, GAME.DROP_Y, type, false);

        state.canDrop = false;

        setTimeout(function () {
            if (state.gameOver) return;
            state.currentType = state.nextType;
            state.nextType = randomDropType();
            state.canDrop = true;
        }, GAME.DROP_COOLDOWN);
    }

    function restart() {
        Physics.removeAll();
        state.score = 0;
        state.displayScore = 0;
        state.targetScore = 0;
        state.phase = 'playing';
        state.gameOver = false;
        state.gameOverReady = false;
        state.gameOverStartTime = 0;
        state.isNewHighScore = false;
        state.dangerTimer = 0;
        state.canDrop = true;
        state.comboCount = 0;
        state.lastMergeTime = 0;
        state.currentType = randomDropType();
        state.nextType = randomDropType();
        state.cursorX = GAME.CANVAS_WIDTH / 2;
    }

    function checkGameOver() {
        var bodies = Physics.getBodies();
        var now = Date.now();
        var anyAboveLine = false;

        for (var i = 0; i < bodies.length; i++) {
            var b = bodies[i];
            if (b.position.y - JELLYFISH_TYPES[b.jellyfishType].radius < GAME.DANGER_Y) {
                anyAboveLine = true;
                break;
            }
        }

        if (anyAboveLine) {
            if (state.dangerTimer === 0) {
                state.dangerTimer = now;
            } else if (now - state.dangerTimer > 2000) {
                state.gameOver = true;
                state.phase = 'gameover';
                state.gameOverStartTime = now;

                // High score check
                var hs = getHighScore();
                if (state.score > hs) {
                    setHighScore(state.score);
                    state.isNewHighScore = true;
                }

                setTimeout(function () {
                    state.gameOverReady = true;
                }, 1600);
            }
        } else {
            state.dangerTimer = 0;
        }
    }

    // Score animation helper
    var scoreAnimFrom = 0;
    function updateScoreAnimation() {
        if (state.score !== state.targetScore) {
            scoreAnimFrom = state.displayScore;
            state.targetScore = state.score;
            state.scoreAnimStart = Date.now();
        }
        if (state.displayScore !== state.targetScore) {
            var elapsed = Date.now() - state.scoreAnimStart;
            var t = Math.min(1, elapsed / 300);
            var eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            state.displayScore = scoreAnimFrom + (state.targetScore - scoreAnimFrom) * eased;
            if (t >= 1) {
                state.displayScore = state.targetScore;
            }
        }
    }

    function getScoreScale() {
        if (state.displayScore === state.targetScore) return 1.0;
        var elapsed = Date.now() - state.scoreAnimStart;
        if (elapsed > 300) return 1.0;
        var t = elapsed / 300;
        // Pop: 1.0 -> 1.15 -> 1.0
        return 1.0 + Math.sin(t * Math.PI) * 0.15;
    }

    function getDangerLevel() {
        if (state.dangerTimer === 0) return 0;
        return Math.min(1.0, (Date.now() - state.dangerTimer) / 2000);
    }

    function gameLoop() {
        if (state.phase === 'playing' && !state.gameOver) {
            Physics.update();
            checkGameOver();
        }

        updateScoreAnimation();

        // Draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground(ctx, canvas);

        if (state.phase === 'title') {
            // Title screen
            UI.drawTitleScreen(ctx, canvas, getHighScore());
        } else {
            // Game or gameover
            UI.drawWalls(ctx);
            UI.drawDangerLine(ctx, GAME.DANGER_Y, getDangerLevel());

            // Draw all physics jellyfish bodies
            var bodies = Physics.getBodies();
            for (var i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                var type = body.jellyfishType;
                var jelly = JELLYFISH_TYPES[type];
                drawJellyfish(ctx, body.position.x, body.position.y, jelly.radius, type, 1.0);
            }

            // Draw preview jellyfish at cursor (no physics body)
            if (state.canDrop && !state.gameOver) {
                var previewType = state.currentType;
                var previewRadius = JELLYFISH_TYPES[previewType].radius;
                var previewX = clampX(state.cursorX, previewRadius);
                var jellyColor = JELLYFISH_TYPES[previewType].bodyColor;

                // Drop guide: gradient beam
                ctx.save();
                var guideGrad = ctx.createLinearGradient(0, GAME.DROP_Y + previewRadius, 0, GAME.CANVAS_HEIGHT - Physics.WALL_THICKNESS);
                guideGrad.addColorStop(0, jellyColor + '28');
                guideGrad.addColorStop(0.5, jellyColor + '10');
                guideGrad.addColorStop(1, jellyColor + '04');
                ctx.strokeStyle = guideGrad;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(previewX, GAME.DROP_Y + previewRadius);
                ctx.lineTo(previewX, GAME.CANVAS_HEIGHT - Physics.WALL_THICKNESS);
                ctx.stroke();

                // Landing zone glow
                ctx.globalAlpha = 0.15;
                var landingGrad = ctx.createRadialGradient(previewX, GAME.CANVAS_HEIGHT - Physics.WALL_THICKNESS, 0, previewX, GAME.CANVAS_HEIGHT - Physics.WALL_THICKNESS, previewRadius * 1.2);
                landingGrad.addColorStop(0, jellyColor + '40');
                landingGrad.addColorStop(1, jellyColor + '00');
                ctx.fillStyle = landingGrad;
                ctx.beginPath();
                ctx.ellipse(previewX, GAME.CANVAS_HEIGHT - Physics.WALL_THICKNESS, previewRadius * 1.2, previewRadius * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Preview jellyfish (semi-transparent)
                drawJellyfish(ctx, previewX, GAME.DROP_Y, previewRadius, previewType, 0.6);
            }

            // Draw merge effects and popups
            UI.drawMergeEffects(ctx);
            UI.drawScorePopups(ctx);
            UI.drawCombo(ctx, canvas.width);

            // Draw HUD
            UI.drawScore(ctx, state.displayScore, getScoreScale());
            UI.drawNextPreview(ctx, state.nextType);

            if (state.gameOver) {
                var goElapsed = Date.now() - state.gameOverStartTime;
                UI.drawGameOver(ctx, canvas, state.score, getHighScore(), state.isNewHighScore, goElapsed);
            }
        }

        requestAnimationFrame(gameLoop);
    }

    // Input handling
    function getCanvasX(event) {
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var clientX;
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
        } else if (event.changedTouches && event.changedTouches.length > 0) {
            clientX = event.changedTouches[0].clientX;
        } else {
            clientX = event.clientX;
        }
        return (clientX - rect.left) * scaleX;
    }

    canvas.addEventListener('mousemove', function (e) {
        if (state.phase !== 'playing' || state.gameOver) return;
        state.cursorX = getCanvasX(e);
    });

    canvas.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (state.phase !== 'playing' || state.gameOver) return;
        state.cursorX = getCanvasX(e);
    }, { passive: false });

    canvas.addEventListener('click', function (e) {
        if (state.phase === 'title') {
            restart();
            return;
        }
        if (state.gameOver) {
            if (state.gameOverReady) restart();
            return;
        }
        drop();
    });

    canvas.addEventListener('touchend', function (e) {
        e.preventDefault();
        if (state.phase === 'title') {
            restart();
            return;
        }
        if (state.gameOver) {
            if (state.gameOverReady) restart();
            return;
        }
        drop();
    }, { passive: false });

    init();
})();
