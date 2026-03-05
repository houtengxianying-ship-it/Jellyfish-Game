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

    var state = {
        score: 0,
        gameOver: false,
        gameOverReady: false,
        nextType: randomDropType(),
        currentType: randomDropType(),
        cursorX: GAME.CANVAS_WIDTH / 2,
        canDrop: true,
        dangerTimer: 0,
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
            state.score += JELLYFISH_TYPES[newType].score;
            UI.addMergeEffect(x, y, JELLYFISH_TYPES[newType].radius);
        };

        requestAnimationFrame(gameLoop);
    }

    function drop() {
        if (!state.canDrop || state.gameOver) return;

        var type = state.currentType;
        var radius = JELLYFISH_TYPES[type].radius;
        var x = clampX(state.cursorX, radius);

        // Create a dynamic body directly — no static→dynamic transition
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
        state.gameOver = false;
        state.gameOverReady = false;
        state.dangerTimer = 0;
        state.canDrop = true;
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
                setTimeout(function () {
                    state.gameOverReady = true;
                }, 800);
            }
        } else {
            state.dangerTimer = 0;
        }
    }

    function gameLoop() {
        if (!state.gameOver) {
            Physics.update();
            checkGameOver();
        }

        // Draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground(ctx, canvas);
        UI.drawWalls(ctx);
        UI.drawDangerLine(ctx, GAME.DANGER_Y);

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

            // Drop guide line
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(previewX, GAME.DROP_Y + previewRadius);
            ctx.lineTo(previewX, GAME.CANVAS_HEIGHT - Physics.WALL_THICKNESS);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Preview jellyfish (semi-transparent)
            drawJellyfish(ctx, previewX, GAME.DROP_Y, previewRadius, previewType, 0.6);
        }

        // Draw merge effects
        UI.drawMergeEffects(ctx);

        // Draw UI
        UI.drawScore(ctx, state.score);
        UI.drawNextPreview(ctx, state.nextType);

        if (state.gameOver) {
            UI.drawGameOver(ctx, canvas, state.score);
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
        if (state.gameOver) return;
        state.cursorX = getCanvasX(e);
    });

    canvas.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (state.gameOver) return;
        state.cursorX = getCanvasX(e);
    }, { passive: false });

    canvas.addEventListener('click', function (e) {
        if (state.gameOver) {
            if (state.gameOverReady) restart();
            return;
        }
        drop();
    });

    canvas.addEventListener('touchend', function (e) {
        e.preventDefault();
        if (state.gameOver) {
            if (state.gameOverReady) restart();
            return;
        }
        drop();
    }, { passive: false });

    init();
})();
