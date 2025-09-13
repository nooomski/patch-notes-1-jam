// CANVAS SIZE
const W = 960, H = 640;

// ----- PARAMS -----
const TRAIL_WIDTH     = 6;     // px
const TRAIL_MAX_LENGTH= 20;    // frames before trail turns solid
const MAX_STEP_UP     = 16;     // max px to "walk up" slopes
const GRAVITY         = 2;
const GROUND_DRAG     = 0.22;  // 0.10–0.25 feels good
const AIR_DRAG        = 0.02;
const VX_DEADZONE     = 0.03;

const RUN_ACCEL       = 2;
const MAX_RUN_SPEED   = 10.0;
const MAX_FALL_SPEED  = 20.0;
const JUMP_VELOCITY   = -30.0;
//const JUMP_BUFFER_FR  = 8;     // press jump a bit early and still jump
//const HITBOX_SIZE     = 12;
//const COLOR_SOLID     = [0];

const DEGUB_MODE = false;

// THE X & Y POSITIONS ARE AT TOP LEFT CORNER OF THE PLAYER
const player = {
    x: -1, y: -1,
    w: 0, h: 0,
    vx: 0, vy: 0,
    onGround: false,
    //coyote: 0,
    //jumpBuf: 0,
    //lastX: 160, lastY: 120
};

// Globals
let trail = [{x: 0, y: 0}];
let goalHit = false;
let passthroughHit = false;
let cnv;
let displayLayer, solidMask;
let displayImg;
let originalPlayerPosition = {x: -1, y: -1};

let loadingNextLevel = false;

let startTime = 0;
let keyA, keyN, keyY;
let anyKeyTries = 0;

function preload() {
    displayImg = loadImage(MAPS[current_level].img)
    player_color_index = MAPS[current_level].color_index
    updateColorScheme(player_color_index)
    // Load any-key images
    keyA = loadImage('Levels/a.png')
    keyN = loadImage('Levels/n.png')
    keyY = loadImage('Levels/y.png')
}

function setup() {
	cnv = createCanvas(W, H);
	pixelDensity(1);
    noSmooth();

    // Layer that's visualized
    displayLayer = createGraphics(W, H);
    displayLayer.pixelDensity(1);
    displayLayer.noSmooth();
    
    // Layer that only contains solids (e.g. no trail)
    solidMask = createGraphics(W, H);
    solidMask.pixelDensity(1);
    solidMask.noSmooth();

    resetLevel();
    fitCanvas();
}

function windowResized() {
    fitCanvas();
}

function draw() {

    if (!loadingNextLevel) movePlayer();

    if (goalHit) {
        loadingNextLevel = true;
        console.log("Goal hit! Loading next level...", passthroughHit);
        loadNextLevel();
        goalHit = false
    }

    // Load solidmask pixels into memory so it can be used this frame.
    solidMask.loadPixels();

    if (passthroughHit) {
        shakeScreen(SCREENSHAKE_MAX_FRAMES);
        // change passthrough color and background color
        console.log("Changing colors", COLORS[passthrough_color_index], COLORS[background_color_index + 1 % COLORS.length]);
        changeColors(COLORS[passthrough_color_index], COLORS[background_color_index + 1 % COLORS.length])
        console.log("Changing background color", COLORS[background_color_index], COLORS[background_color_index + 1 % COLORS.length]);
        changeColors(COLORS[background_color_index], COLORS[background_color_index + 1 % COLORS.length])
        updateColorScheme(player_color_index + 1 % COLORS.length)
        passthroughHit = false;
        // change player color
    }

    // Draw player on Display Layer
    if (player.x !== -1 && player.y !== -1) {
        displayLayer.noStroke();
        displayLayer.fill(COLORS[player_color_index][0], COLORS[player_color_index][1], COLORS[player_color_index][2]);
        displayLayer.rectMode(CORNER);   
        displayLayer.rect(player.x, player.y, player.w, player.h);
        displayLayer.rectMode(CORNER);  
    }

    // Draw oldest player trail position on solidMask
    if ((trail.length == TRAIL_MAX_LENGTH) && (Math.round(trail[0].x) !== Math.round(player.x) || Math.round(trail[0].y) !== Math.round(player.y))) {
        solidMask.noStroke();
        solidMask.fill(COLORS[player_color_index][0], COLORS[player_color_index][1], COLORS[player_color_index][2]);
        solidMask.rectMode(CORNER);   
        solidMask.rect(trail[0].x, trail[0].y, player.w, player.h);
        if (DEGUB_MODE) {
            displayLayer.noStroke();
            displayLayer.fill(COLORS[player_color_index+1][0], COLORS[player_color_index+1][1], COLORS[player_color_index+1][2]);
            displayLayer.rectMode(CORNER);   
            displayLayer.rect(trail[0].x, trail[0].y, player.w, player.h);
        }
    }

    // Draw player on solidMask to carve out the player's area
    solidMask.noStroke();
    solidMask.fill(COLORS[background_color_index][0], COLORS[background_color_index][1], COLORS[background_color_index][2]);
    solidMask.rectMode(CORNER);   
    solidMask.rect(player.x, player.y, player.w, player.h);
    solidMask.rectMode(CORNER);

    // Draw Time & handle start screen
    if (startTime > 0) {
        displayLayer.fill(255);
        displayLayer.textSize(40);
        displayLayer.textAlign(LEFT, TOP);

        let totalSeconds = round(millis() / 1000);
        let t = round(totalSeconds-startTime);
        displayLayer.text("TIME: " + t, 20,20);
    }
    if (current_level == 0) {
        handleStartScreen();
    }

    handleScreenShake();

    // Draw Display Layer
    image(displayLayer, screenShakeX, screenShakeY);
    drawRGBSplit(displayLayer, screenShakeCounter + current_level/2);
    
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

function findPlayerPositionAndLength() {
    displayLayer.loadPixels();
    let player = {x: 0, y: 0, length: 0};
    let start = false;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            // Loop through all pixels from top-left to bottom-right to find the first player pixel
            const idx = 4 * (y * W + x);
            const r = displayLayer.pixels[idx];
            const g = displayLayer.pixels[idx + 1];
            const b = displayLayer.pixels[idx + 2];
            // console.log("Checking pixel", x, y, r, g, b);
            if (isPlayerColor(r, g, b)) {
                if (!start) {
                    start = true;
                    player.x = x;
                    player.y = y;
                }
                player.length++;
            } else if (start) {
                console.log("Player found in display layer", COLORS[player_color_index], x, y);
                return player;
            }
        }
    }
    return null;
}

function findAllColors() {
    displayLayer.loadPixels();
    let colors = [];
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const idx = 4 * (y * W + x);
            const r = displayLayer.pixels[idx];
            const g = displayLayer.pixels[idx + 1];
            const b = displayLayer.pixels[idx + 2];
            // Check if this color is already in the list
            let exists = colors.some(c => c[0] === r && c[1] === g && c[2] === b);
            if (!exists) {
                colors.push([r, g, b]);
            }
        }
    }
    return colors;
}

function handleStartScreen() {
    let a, n, y;
    // Draw key images based on which key is pressed
    if (keyIsDown(65) || keyIsDown(97)) { // 'A' or 'a'
        a = true;
		displayLayer.image(keyA, 0, 0, W, H);
    }
	if (keyIsDown(78) || keyIsDown(110)) { // 'N' or 'n'
        n = true;
		displayLayer.image(keyN, 0, 0, W, H);
    }
	if (keyIsDown(89) || keyIsDown(121)) { // 'Y' or 'y'
        y = true;
		displayLayer.image(keyY, 0, 0, W, H);
	}
    if (a && n && y) {
        loadNextLevel();
    }

	// Redraw level on top transparently so the previous key images fade out
	displayLayer.push();
	displayLayer.tint(255, 32);
	displayLayer.image(displayImg, 0, 0, W, H);
	displayLayer.noTint();
	displayLayer.pop();
}

function changeColors(oldColor, newColor) {
    displayLayer.loadPixels();
    for (let i = 0; i < displayLayer.pixels.length; i += 4) {
        const r = displayLayer.pixels[i];
        const g = displayLayer.pixels[i + 1];
        const b = displayLayer.pixels[i + 2];
        if (isCloseToColor(r, g, b, oldColor)) {
            displayLayer.pixels[i] = newColor[0];
            displayLayer.pixels[i + 1] = newColor[1];
            displayLayer.pixels[i + 2] = newColor[2];
            solidMask.pixels[i] = newColor[0];
            solidMask.pixels[i + 1] = newColor[1];
            solidMask.pixels[i + 2] = newColor[2];
        }
    }
    solidMask.updatePixels();
    displayLayer.updatePixels();
}

function keyPressed() {
    let k = key.toLowerCase();
    if (current_level != 0) {
        if (k === 'r') {
            resetLevel(); // runs once per press
        }
    }
    else if ((k !== 'a') && (k !== 'n') && (k !== 'y')) {
        shakeScreen(Math.min(SCREENSHAKE_MAX_FRAMES * 2, SCREENSHAKE_MAX_FRAMES / 2 + anyKeyTries / 4));
        anyKeyTries++;
    }
}