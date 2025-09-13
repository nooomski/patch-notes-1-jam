const W = 1440, H = 1080;

// ----- PARAMS -----
const TRAIL_WIDTH     = 6;     // px
const TRAIL_MAX_LENGTH= 30;    // frames before trail turns solid
const MAX_STEP_UP     = 5;     // max px to "walk up" slopes
const GRAVITY         = 2;
const GROUND_DRAG     = 0.22;  // 0.10–0.25 feels good
const AIR_DRAG        = 0.02;
const VX_DEADZONE     = 0.01;

const RUN_ACCEL       = 2;
const MAX_RUN_SPEED   = 10.0;
const MAX_FALL_SPEED  = 20.0;
const JUMP_VELOCITY   = -25.0;
//const JUMP_BUFFER_FR  = 8;     // press jump a bit early and still jump
const PLAYER_SIZE     = 64;
//const HITBOX_SIZE     = 12;
const COLOR_AIR       = [96, 96, 96];
const COLOR_DOOR      = [63, 54, 54];
//const COLOR_SOLID     = [0];

// THE X & Y POSITIONS ARE AT TOP LEFT CORNER OF THE PLAYER
const player = {
    x: 160, y: 120,
    w: PLAYER_SIZE, h: PLAYER_SIZE,
    vx: 0, vy: 0,
    onGround: false,
    //coyote: 0,
    //jumpBuf: 0,
    //lastX: 160, lastY: 120
};

let trail = [{x: 0, y: 0}];
let doorHit = false;

function preload() {
    levelImg = loadImage('level.png');
}

function setup() {
	cnv = createCanvas(W, H);
	pixelDensity(1);
    noSmooth();

    // Layer that's visualized
    displayLayer = createGraphics(W, H);
    displayLayer.pixelDensity(1);
    // Layer that only contains solids (e.g. no trail)
    solidMask = createGraphics(W, H);
    solidMask.pixelDensity(1);

    resetLevel();

    fitCanvas();
}

function windowResized() {
    fitCanvas();
  }

function resetLevel() {
    // Clear layers
    displayLayer.clear(); // keep transparent so we can draw exactly what we want
    solidMask.clear();

    if (levelImg) {
        displayLayer.image(levelImg, 0, 0, W, H);
        solidMask.image(levelImg, 0, 0, W, H);
    }
    else console.error('Level image not loaded');

    player.x = 160; player.y = 120;
    player.vx = 0;  player.vy = 0;
    player.onGround = false;
    //player.coyote = 0;
    //player.jumpBuf = 0;
    //player.lastX = player.x; player.lastY = player.y;

    trail.length = 0;
    doorHit = false;
}

function draw() {
    // Load solidmask pixels into memory so it can be used this frame.
    solidMask.loadPixels();

    // Input
    const left  = keyIsDown(LEFT_ARROW)  || keyIsDown(65);  // LEFT / A
    const right = keyIsDown(RIGHT_ARROW) || keyIsDown(68);  // RIGHT / D
    const jump  = keyIsDown(32) || keyIsDown(87) || keyIsDown(UP_ARROW); // SPACE / W / UP
    if (keyIsDown(82)) resetLevel(); // R to reset

    // Horizontal acceleration
    const targetAx = (right - left) * RUN_ACCEL;
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

    if (jump && player.onGround) player.vy = JUMP_VELOCITY;

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

    // Update trail
    trail.push({x: player.x, y: player.y});
    if (trail.length > TRAIL_MAX_LENGTH) trail.shift();

    // Draw player on Display Layer
    displayLayer.noStroke();
    displayLayer.fill(218, 232, 252);
    displayLayer.rectMode(CORNER);   
    displayLayer.rect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
    displayLayer.rectMode(CORNER);

    // Draw Display Layer
    image(displayLayer, 0, 0);

    // Draw oldest player trail position on solidMask
    if ((trail.length == TRAIL_MAX_LENGTH) && (Math.round(trail[0].x) !== Math.round(player.x) && Math.round(trail[0].y) !== Math.round(player.y))) {
        solidMask.noStroke();
        solidMask.fill(218, 232, 252);
        solidMask.rectMode(CORNER);   
        solidMask.rect(trail[0].x, trail[0].y, PLAYER_SIZE, PLAYER_SIZE);
        solidMask.rectMode(CORNER);
    }

    // Draw Score
    displayLayer.fill(255);
    displayLayer.textSize(40);
    displayLayer.textAlign(LEFT, TOP);

    let totalSeconds = floor(millis() / 1000);
    displayLayer.text("TIME: " + totalSeconds, 20,20);
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

function isBoxFree(x, y, w, h) {
    // Treat out-of-bounds as solid
    if (x < 0 || y < 0 || x + w > W || y + h > H) return false;

    const ix = x | 0, iy = y | 0, iw = w | 0, ih = h | 0;

    for (let py = iy; py < iy + ih; py++) {
        const row = py * W;
        for (let px = ix; px < ix + iw; px++) {
            const idx = 4 * (row + px);
            const r = solidMask.pixels[idx];
            const g = solidMask.pixels[idx + 1];
            const b = solidMask.pixels[idx + 2];

            // Door detection
            if (r === COLOR_DOOR[0] && g === COLOR_DOOR[1] && b === COLOR_DOOR[2]) {
                doorHit = true;
            }

            // Anything that's not AIR blocks
            if (r !== COLOR_AIR[0] || g !== COLOR_AIR[1] || b !== COLOR_AIR[2]) {
                return false;
            }
        }
    }
    return true;
}  

function fitCanvas() {
    // compute the largest uniform scale that fits
    const scale = Math.min(windowWidth / W, windowHeight / H);
    const cssW = Math.floor(W * scale);
    const cssH = Math.floor(H * scale);
  
    // set CSS size (scales the raster)
    cnv.style('width', cssW + 'px');
    cnv.style('height', cssH + 'px');
  
    // center on the page
    cnv.position(
      Math.floor((windowWidth - cssW) / 2),
      Math.floor((windowHeight - cssH) / 2)
    );
}