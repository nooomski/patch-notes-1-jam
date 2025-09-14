function movePlayer() {
    let targetAx = 0;
    let left, right, jump;
    if (current_level != 10) {
        // Input
        left  = keyIsDown(LEFT_ARROW)  || keyIsDown(65);  // LEFT / A
        right = keyIsDown(RIGHT_ARROW) || keyIsDown(68);  // RIGHT / D
        jump  = keyIsDown(32) || keyIsDown(87) || keyIsDown(UP_ARROW); // SPACE / W / UP

        // Horizontal acceleration
        targetAx = (right - left) * RUN_ACCEL;
    }
    else {
        // Level 10: Any key accelerates left
        let anyKeyPressed = false;
        for (let i = 0; i < 256; i++) {
            if (keyIsDown(i) && i !== 82 && i !== 114) { // Exclude 'R' (82) and 'r' (114)
                anyKeyPressed = true;
                break;
            }
        }
        
        if (anyKeyPressed) player.vx -= RUN_ACCEL;
        //targetAx = anyKeyPressed ? -RUN_ACCEL : 0;

        // Mouse input for right movement
        if (mouseIsPressed || levelTimeCounter/1000 > 5) {
            player.vx += RUN_ACCEL;
        }
    }

    player.vx += targetAx;
    player.vx = constrain(player.vx, -MAX_RUN_SPEED, MAX_RUN_SPEED);

    // Friction when grounded and not accelerating
    if (player.onGround) {
        if (targetAx === 0) {
            player.vx -= player.vx * GROUND_DRAG;
        }
    } else {
        player.vx -= player.vx * AIR_DRAG;
    }
    if (Math.abs(player.vx) < VX_DEADZONE) player.vx = 0;

    // X axis movement with step-up
    const res = moveXWithStep(player, player.vx, player.w, player.h);
    player.x += res.x; player.y += res.y;
    if (res.hitWall) player.vx = 0;

    // Gravity
    player.vy += GRAVITY;

    // Jump
    if (!isBoxFree(player.x, player.y + 1, player.w, player.h)) player.onGround = true;
    else player.onGround = false;

    if (jump && player.onGround && current_level != 10) player.vy = JUMP_VELOCITY;

    player.vy = constrain(player.vy, -MAX_FALL_SPEED, MAX_FALL_SPEED);

    // Y axis movement
    const ty = player.y + player.vy;
    if (!isBoxFree(player.x, ty, player.w, player.h)) {
        const dir = Math.sign(player.vy);
        let remaining = Math.abs(player.vy);
        while (remaining > 0 && isBoxFree(player.x, player.y + dir, player.w, player.h)) {
            player.y += dir;
            remaining--;
        }
        if (dir > 0) player.onGround = true; else player.onGround = false;
            player.vy = 0;
        } else {
            player.y = ty;
            player.onGround = false;
    }

    // wrap the x axis
    player.x = (player.x + W) % W;
    // Update trail
    trail.push({x: player.x, y: player.y});
    if (trail.length > TRAIL_MAX_LENGTH) trail.shift();

    // Check if player is stuck
    if (current_level != 0) {
        let x = player.x, y = player.y, w = player.w, h = player.h;
        if (!player.isStuck) {
            if (!isBoxFree(x + 1, y, w, h) && !isBoxFree(x - 1, y, w, h) && !isBoxFree(x, y + 1, w, h) && !isBoxFree(x, y - 1, w, h)) {
                console.log("Player is stuck", "up", isBoxFree(x, y - 1, w, h, true));
                player.isStuck = true;
                shakeScreen(SCREENSHAKE_MAX_FRAMES);
            }
        }
    }
    if (current_level == 10) {
        if (player.x <= 0 && !player.isStuck) {
            player.isStuck = true;
            shakeScreen(SCREENSHAKE_MAX_FRAMES);
        }
    }
}

// Returns the final position { x, y } it can move to, including a step-up for slopes
function moveXWithStep(o, vx, w, h) {
    if (vx === 0) return { x: 0, y: 0, hitWall: false };
  
    const dir = Math.sign(vx);
    let x = o.x, y = o.y;
    const intended = Math.abs(vx);
    let moved = 0;
  
    while (moved < intended) {
        if (isBoxFree(x + dir, y, w, h)) {
            x += dir; moved++;
            continue;
        }
        // try small climb
        let climbed = false;
        for (let step = 1; step <= MAX_STEP_UP; step++) {
            if (isBoxFree(x + dir, y - step, w, h) && isBoxFree(x, y - step, w, h)) {
                y -= step; x += dir; moved++; climbed = true; break;
            }
        }
        if (!climbed) break; // blocked
    }
  
    return { x: x - o.x, y: y - o.y, hitWall: moved < intended };
}

function isBoxFree(x, y, w, h, withPrint = false) {
    // Treat out-of-bounds as solid
    if (isSecondRound()) {
        x = x % W; // wrap the x axis
        if (y < 0 || y + h > H) return false;

        // can't move through the middle of the screen
        if (x + w > W/2 && x < W/2) {
            drawForceField();
            return false;
        }
        if (x < W/2 && x + w > W/2) {
            drawForceField();
            return false;
        }
    } else if (x < 0 || y < 0 || x + w > W || y + h > H) return false;

    const ix = x | 0, iy = y | 0, iw = w | 0, ih = h | 0;

    for (let py = iy; py < iy + ih; py++) {
        const row = py * W;
        if ((ix + iw) > W) {
            for (let px = 0; px < (ix + iw) % W; px++) {
                const idx = 4 * (row + px);
                const r = solidMask.pixels[idx];
                const g = solidMask.pixels[idx + 1];
                const b = solidMask.pixels[idx + 2];

                if (isGoalColor(r, g, b)) {
                    goalHit = true;
                }

                if (isPassthroughColor(r, g, b)) {
                    passthroughHit = true;
                }

                if (!isBackgroundColor(r, g, b)) {
                    if (withPrint) console.log("Box is not background color", r, g, b, x, y, w, h);
                    return false;
                }
            }
        }
        for (let px = ix; px < min(ix + iw, W); px++) {
            const idx = 4 * (row + px);
            const r = solidMask.pixels[idx];
            const g = solidMask.pixels[idx + 1];
            const b = solidMask.pixels[idx + 2];

            if (isGoalColor(r, g, b)) {
                goalHit = true;
            }

            if (isPassthroughColor(r, g, b)) {
                passthroughHit = true;
            }

            if (!isBackgroundColor(r, g, b)) {
                if (withPrint) console.log("Box is not background color 2", r, g, b, x, y, w, h);
                return false;
            }
        }
    }
    return true;
}