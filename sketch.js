// CANVAS SIZE
const W = 960, H = 640;

// ----- PARAMS -----
const TRAIL_WIDTH     = 6;     // px
const TRAIL_MAX_LENGTH= 30;    // frames before trail turns solid
const MAX_STEP_UP     = 32;     // max px to "walk up" slopes
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

const SCREENSHAKE_INTENSITY = 20;
const SCREENSHAKE_MAX_FRAMES = 10;

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
let cnv;
let displayLayer, solidMask;
let screenShakeX = 0, screenShakeY = 0;
let screenShakeCounter = 0;
let glitch;
let displayImg;
let originalPlayerPosition = {x: -1, y: -1};

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

    glitch = new Glitch();
    glitch.loadType('jpg');

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

    if (displayImg) {
        displayLayer.image(displayImg, 0, 0, W, H);
        solidMask.image(displayImg, 0, 0, W, H);
    }
    else console.error('Level image not loaded');

    let allColors = findAllColors();
    console.log("Displayed colors", allColors);
    console.log("Actual colors", COLORS);

    playerInfo = findPlayerPositionAndLength();
    if (playerInfo) {
        console.log("Player found in display layer", playerInfo);
        originalPlayerPosition.x = playerInfo.x;
        originalPlayerPosition.y = playerInfo.y;
        player.x = originalPlayerPosition.x;
        player.y = originalPlayerPosition.y;
        player.w = playerInfo.length;
        player.h = playerInfo.length; // assuming square
    } else {
        console.error('Player not found in display layer');
    }
    player.vx = 0;  player.vy = 0;
    player.onGround = false;

    // Draw a square the size of the player in the background color at the player's position on the solidMask
    solidMask.noStroke();
    solidMask.fill(
        COLORS[background_color_index][0],
        COLORS[background_color_index][1],
        COLORS[background_color_index][2]
    );
    solidMask.rectMode(CORNER);
    solidMask.rect(player.x, player.y, player.w, player.h);
    solidMask.rectMode(CORNER);


    //player.coyote = 0;
    //player.jumpBuf = 0;
    //player.lastX = player.x; player.lastY = player.y;

    trail.length = 0;
    goalHit = false;

    shakeScreen(SCREENSHAKE_MAX_FRAMES);
}

function draw() {
    if (keyIsDown(82)) resetLevel(); // R to reset
    movePlayer();

    if (goalHit) {
        loadNextLevel();
    }

    // Draw player on Display Layer
    if (player.x !== -1 && player.y !== -1) {
        displayLayer.noStroke();
        displayLayer.fill(COLORS[player_color_index][0], COLORS[player_color_index][1], COLORS[player_color_index][2]);
        displayLayer.rectMode(CORNER);   
        displayLayer.rect(player.x, player.y, player.w, player.h);
        displayLayer.rectMode(CORNER);  
    }

    // Load solidmask pixels into memory so it can be used this frame.
    solidMask.loadPixels();

    // Draw oldest player trail position on solidMask
    if ((trail.length == TRAIL_MAX_LENGTH) && (Math.round(trail[0].x) !== Math.round(player.x) || Math.round(trail[0].y) !== Math.round(player.y))) {
        solidMask.noStroke();
        solidMask.fill(COLORS[player_color_index][0], COLORS[player_color_index][1], COLORS[player_color_index][2]);
        solidMask.rectMode(CORNER);   
        solidMask.rect(trail[0].x, trail[0].y, player.w, player.h);
        solidMask.rectMode(CORNER);
        displayLayer.noStroke();
        displayLayer.fill(COLORS[player_color_index+1][0], COLORS[player_color_index+1][1], COLORS[player_color_index+1][2]);
        displayLayer.rectMode(CORNER);   
        displayLayer.rect(trail[0].x, trail[0].y, player.w, player.h);
        displayLayer.rectMode(CORNER);
    }

    // Draw player on solidMask to carve out the player's area
    solidMask.noStroke();
    solidMask.fill(COLORS[background_color_index][0], COLORS[background_color_index][1], COLORS[background_color_index][2]);
    solidMask.rectMode(CORNER);   
    solidMask.rect(player.x, player.y, player.w, player.h);
    solidMask.rectMode(CORNER);

    // Draw Score
    displayLayer.fill(255);
    displayLayer.textSize(40);
    displayLayer.textAlign(LEFT, TOP);

    let totalSeconds = floor(millis() / 1000);
    displayLayer.text("TIME: " + totalSeconds, 20,20);

    // Screen Shake
    if (screenShakeCounter > 0) {
        let intensity = SCREENSHAKE_INTENSITY * (screenShakeCounter / SCREENSHAKE_MAX_FRAMES);
        screenShakeX = random(-intensity/2, intensity/2);
        screenShakeY = random(-intensity/2, intensity/2);
        screenShakeCounter--;
    } else {
        screenShakeX = 0;
        screenShakeY = 0;
    }


    // Draw Display Layer
    image(displayLayer, -SCREENSHAKE_INTENSITY/2+screenShakeX, -SCREENSHAKE_INTENSITY/2+screenShakeY);
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

function shakeScreen(intensity) {
    screenShakeCounter = intensity;
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