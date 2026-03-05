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
        gameOverReady: false, // can tap to retry
        nextType: randomDropType(),
        currentBody: null,
        currentType: randomDropType(),
        cursorX: GAME.CANVAS_WIDTH / 2,
        canDrop: true,
        dangerTimer: 0, // timestamp when danger started
    };

    function randomDropType() {
        return Math.floor(Math.random() * 5) + 1;
    }

    function init() {
        Physics.init();

        Physics.onMerge = function (newType, x, y) {
            state.score += JELLYFISH_TYPES[newType].score;
            UI.addMergeEffect(x, y, JELLYFISH_TYPES[newType].radius);
        };

        spawnCurrentJellyfish();
        requestAnimationFrame(gameLoop);
    }

    function spawnCurrentJellyfish() {
        var type = state.currentType;
        var radius = JELLYFISH_TYPES[type].radius;
        var x = clampX(state.cursorX, radius);
        state.currentBody = Physics.createJellyfish(x, GAME.DROP_Y, type, true);
    }

    function clampX(x, radius) {
        var minX = Physics.WALL_THICKNESS + radius;
        var maxX = GAME.CANVAS_WIDTH - Physics.WALL_THICKNESS - radius;
        return Math.max(minX, Math.min(maxX, x));
    }

    function drop() {
        if (!state.canDrop || state.gameOver || !state.currentBody) return;

        Physics.dropJellyfish(state.currentBody);
        state.currentBody = null;
        state.canDrop = false;

        // Prepare next jellyfish after cooldown
        setTimeout(function () {
            if (state.gameOver) return;
            state.currentType = state.nextType;
            state.nextType = randomDropType();
            spawnCurrentJellyfish();
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
        spawnCurrentJellyfish();
    }

    function checkGameOver() {
        var bodies = Physics.getBodies();
        var now = Date.now();
        var anyAboveLine = false;

        for (var i = 0; i < bodies.length; i++) {
            var b = bodies[i];
            if (b.isStatic) continue; // skip currently held jellyfish
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
                // Remove current holding jellyfish
                if (state.currentBody) {
                    Matter.Composite.remove(Physics.world, state.currentBody);
                    state.currentBody = null;
                }
                // Delay before allowing retry tap
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

        // Update current jellyfish position
        if (state.currentBody && state.currentBody.isStatic) {
            var radius = JELLYFISH_TYPES[state.currentType].radius;
            var x = clampX(state.cursorX, radius);
            Matter.Body.setPosition(state.currentBody, { x: x, y: GAME.DROP_Y });
        }

        // Draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground(ctx, canvas);
        UI.drawWalls(ctx);
        UI.drawDangerLine(ctx, GAME.DANGER_Y);

        // Draw all jellyfish bodies
        var bodies = Physics.getBodies();
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            var type = body.jellyfishType;
            var jelly = JELLYFISH_TYPES[type];
            var alpha = body.isStatic ? 0.6 : 1.0;
            drawJellyfish(ctx, body.position.x, body.position.y, jelly.radius, type, alpha);
        }

        // Draw merge effects
        UI.drawMergeEffects(ctx);

        // Draw UI
        UI.drawScore(ctx, state.score);
        UI.drawNextPreview(ctx, state.nextType);

        // Draw drop guide line
        if (state.currentBody && state.currentBody.isStatic && !state.gameOver) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(state.currentBody.position.x, GAME.DROP_Y + JELLYFISH_TYPES[state.currentType].radius);
            ctx.lineTo(state.currentBody.position.x, GAME.CANVAS_HEIGHT - Physics.WALL_THICKNESS);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

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

    // Start the game
    init();
})();
