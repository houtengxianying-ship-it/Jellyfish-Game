// Physics engine using Matter.js
const Physics = {
    engine: null,
    world: null,
    walls: [],
    onMerge: null, // callback: function(newType, x, y)

    WALL_THICKNESS: 15,
    CANVAS_WIDTH: 420,
    CANVAS_HEIGHT: 640,

    init: function () {
        this.engine = Matter.Engine.create();
        this.engine.gravity.y = 1.5;
        this.world = this.engine.world;

        this.createWalls();
        this.setupCollisionDetection();
    },

    createWalls: function () {
        const w = this.CANVAS_WIDTH;
        const h = this.CANVAS_HEIGHT;
        const t = this.WALL_THICKNESS;

        const leftWall = Matter.Bodies.rectangle(t / 2, h / 2, t, h, { isStatic: true, label: 'wall' });
        const rightWall = Matter.Bodies.rectangle(w - t / 2, h / 2, t, h, { isStatic: true, label: 'wall' });
        const floor = Matter.Bodies.rectangle(w / 2, h - t / 2, w, t, { isStatic: true, label: 'wall' });

        this.walls = [leftWall, rightWall, floor];
        Matter.Composite.add(this.world, this.walls);
    },

    MERGE_FREEZE_MS: 250, // freeze duration after merge

    BOUNCE_FORCE: 0.04, // impulse strength for non-merge collisions

    createJellyfish: function (x, y, type, options) {
        const jelly = JELLYFISH_TYPES[type];
        if (!jelly) return null;
        options = options || {};

        // Always create as dynamic first so Matter.js calculates mass properly
        const body = Matter.Bodies.circle(x, y, jelly.radius * 0.7, {
            restitution: 0.6,
            friction: 0.05,
            frictionAir: 0.02,
            isStatic: false,
            label: 'jellyfish',
        });
        body.jellyfishType = type;
        body.isRemoved = false;
        body.isMergeFrozen = !!options.frozen;
        body.createdAt = performance.now();

        // Freeze: set to static AFTER creation so _original mass is saved
        if (options.frozen) {
            Matter.Body.setStatic(body, true);
        }

        Matter.Composite.add(this.world, body);

        // Unfreeze after delay
        if (options.frozen) {
            var freezeMs = this.MERGE_FREEZE_MS;
            setTimeout(function () {
                if (!body.isRemoved) {
                    body.isMergeFrozen = false;
                    Matter.Body.setStatic(body, false);
                    // Reset velocity so it doesn't fly off
                    Matter.Body.setVelocity(body, { x: 0, y: 0 });
                }
            }, freezeMs);
        }

        return body;
    },

    update: function () {
        Matter.Engine.update(this.engine, 1000 / 60);
    },

    getBodies: function () {
        return Matter.Composite.allBodies(this.world).filter(function (b) {
            return b.label === 'jellyfish' && !b.isRemoved;
        });
    },

    removeAll: function () {
        const bodies = this.getBodies();
        for (let i = 0; i < bodies.length; i++) {
            Matter.Composite.remove(this.world, bodies[i]);
        }
    },

    setupCollisionDetection: function () {
        const self = this;
        Matter.Events.on(this.engine, 'collisionStart', function (event) {
            const pairs = event.pairs;
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i];
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                if (bodyA.label !== 'jellyfish' || bodyB.label !== 'jellyfish') continue;
                if (bodyA.isRemoved || bodyB.isRemoved) continue;
                if (bodyA.isStatic || bodyB.isStatic) continue;

                // Different types: bounce apart
                if (bodyA.jellyfishType !== bodyB.jellyfishType) {
                    const dx = bodyA.position.x - bodyB.position.x;
                    const dy = bodyA.position.y - bodyB.position.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const force = self.BOUNCE_FORCE;
                    Matter.Body.applyForce(bodyA, bodyA.position, { x: nx * force, y: ny * force });
                    Matter.Body.applyForce(bodyB, bodyB.position, { x: -nx * force, y: -ny * force });
                    continue;
                }

                const type = bodyA.jellyfishType;

                // Mark as removed to prevent duplicate merges
                bodyA.isRemoved = true;
                bodyB.isRemoved = true;

                // Calculate midpoint
                const midX = (bodyA.position.x + bodyB.position.x) / 2;
                const midY = (bodyA.position.y + bodyB.position.y) / 2;

                // Remove both bodies
                Matter.Composite.remove(self.world, bodyA);
                Matter.Composite.remove(self.world, bodyB);

                // Create merged jellyfish (type + 1) if not max
                if (type < 11) {
                    const newType = type + 1;
                    self.createJellyfish(midX, midY, newType, { frozen: true });

                    if (self.onMerge) {
                        self.onMerge(newType, midX, midY);
                    }
                } else {
                    // Max type merged — bonus score
                    if (self.onMerge) {
                        self.onMerge(11, midX, midY);
                    }
                }
            }
        });
    },
};
