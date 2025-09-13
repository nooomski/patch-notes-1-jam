// CANVAS SIZE
const W = 1200, H = 800;

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
//const COLOR_SOLID     = [0];

const SCREENSHAKE_INTENSITY = 20;
const SCREENSHAKE_MAX_FRAMES = 10;

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

// Globals
let trail = [{x: 0, y: 0}];
let doorHit = false;
let cnv;
let displayLayer, solidMask;
let screenShakeX = 0, screenShakeY = 0;
let screenShakeCounter = 0;
let glitch;
let levelImg;

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

    shakeScreen(SCREENSHAKE_MAX_FRAMES);
}

function draw() {
    movePlayer();

    // Draw player on Display Layer
    displayLayer.noStroke();
    displayLayer.fill(218, 232, 252);
    displayLayer.rectMode(CORNER);   
    displayLayer.rect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
    displayLayer.rectMode(CORNER);

    // Load solidmask pixels into memory so it can be used this frame.
    solidMask.loadPixels();

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