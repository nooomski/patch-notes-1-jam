// CANVAS SIZE
const W = 960, H = 640;

// ----- PARAMS -----
const TRAIL_WIDTH     = 6;      // px
const TRAIL_MAX_LENGTH= 5;      // frames before trail turns solid
const MAX_STEP_UP     = 16;     // max px to "walk up" slopes
const GRAVITY         = 2;
const GROUND_DRAG     = 0.22;   // 0.10–0.25 feels good
const AIR_DRAG        = 0.02;
const VX_DEADZONE     = 0.5;

const RUN_ACCEL       = 2;
const MAX_RUN_SPEED   = 10.0;
const MAX_FALL_SPEED  = 20.0;
const JUMP_VELOCITY   = -30.0;
const COYOTE_TIME     = 8;

const NEXT_LEVEL_DELAY = 500;   // ms

const DEGUB_MODE = false;

// THE X & Y POSITIONS ARE AT TOP LEFT CORNER OF THE PLAYER
const player = {
    x: -1, y: -1,
    w: 0, h: 0,
    vx: 0, vy: 0,
    onGround: false,
    isStuck: false,
    coyote: 0,
};

// Globals
let trail = [{x: 0, y: 0}];
let goalHit = false;
let goal = {x: 0, y: 0, w: 0, h: 0};
let passthroughHit = false;
let cnv;
let displayLayer, solidMask, guiLayer;
let displayImg;
let originalPlayerPosition = {x: -1, y: -1};

let loadingNextLevel = false;
let levelTimeCounter = 0;
let levelTimeStart = 0;

let nextLevelTimeMs = 0;
let nextLevelToLoad = -1;

let startTime = 0;
let finalTime = 0;
let keyA, keyN, keyY, keyHelper;
let aPressed, nPressed, yPressed;
let anyKeyTries = 0;

function preload() {
    displayImg = loadImage(MAPS[current_level].img)
    player_color_index = MAPS[current_level].color_index
    updateColorScheme(player_color_index)
    // Load any-key images
    keyA = loadImage('Levels/a.png')
    keyN = loadImage('Levels/n.png')
    keyY = loadImage('Levels/y.png')
    keyHelper = loadImage('Levels/anyHelper.png')
    iconGoal = loadImage('graphics/goal.png')
    iconPassthrough = loadImage('graphics/passthrough.png')
}

function setup() {
	cnv = createCanvas(W, H);
	pixelDensity(1);
    noSmooth();

    // Layer that's visualized
    displayLayer = createGraphics(W, H);
    displayLayer.pixelDensity(1);
    displayLayer.noSmooth();

    // Layer that contains the GUI
    guiLayer = createGraphics(W, H);
    guiLayer.pixelDensity(1);
    guiLayer.noSmooth();
    
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
    if (isFinalLevel()) {
        displayLayer.image(displayImg, 0, 0, W, H);
    }
    displayLayer.noStroke();
    solidMask.noStroke();

    // Load solidmask pixels into memory so it can be used this frame.
    //console.time('solidMask.loadPixels');
    solidMask.loadPixels();
    //console.timeEnd('solidMask.loadPixels');

    // Move player and manage audio
    if (!loadingNextLevel) {
        //console.time('movePlayer');
        movePlayer();
        //console.timeEnd('movePlayer');
    }
    if (audioInitialized) manageAudio();

    // Check for goal and passthrough
    if (goalHit) {
        if (!loadingNextLevel) {
            loadingNextLevel = true;
            if (current_level != 0) {
                playPing(0.20);
                shakeScreen(SCREENSHAKE_MAX_FRAMES);
            }
            nextLevelToLoad = current_level + 1;
            nextLevelTimeMs = millis() + NEXT_LEVEL_DELAY;
            if (DEGUB_MODE) console.log("Goal hit! Scheduling next level...", { nextLevelToLoad, nextLevelTimeMs });
        }
        goalHit = false
    }
    if (passthroughHit && !isFinalLevel() && !loadingNextLevel) {
        shakeScreen(SCREENSHAKE_MAX_FRAMES);
        // change passthrough color and background color
        changeDisplay(
            COLORS[passthrough_color_index], 
            COLORS[background_color_index], 
            COLORS[(background_color_index + 1) % COLORS.length]
        )

        updateColorScheme((player_color_index + 1) % COLORS.length)
        // track passthroughs for special-case goal color on round 2 level 11
        if (typeof passthroughCountThisLevel !== 'undefined') {
            passthroughCountThisLevel++;
        }
        // find the new place of the goal
        goal = findGoalPositionAndSize();
        if (goal) {
            if (DEGUB_MODE) console.log("Goal found in display layer", goal);
        }

        if (isSecondRound()) {
            if (player.x < W/2) flipHalfOfScreen("left");
            else flipHalfOfScreen("right");
        }
    }
    passthroughHit = false;

    // Handle delayed level load after freeze
    if (loadingNextLevel && nextLevelTimeMs > 0 && millis() >= nextLevelTimeMs) {
        if (nextLevelToLoad >= 0) {
            loadLevel(nextLevelToLoad);
        }
        nextLevelToLoad = -1;
        nextLevelTimeMs = 0;
    }

    // Draw player on Display Layer
    if (player.x !== -1 && player.y !== -1) {
        if (isFinalLevel()) { // overwrite the players starting position
            displayLayer.fill(COLORS[background_color_index][0], COLORS[background_color_index][1], COLORS[background_color_index][2]);
            displayLayer.rect(originalPlayerPosition.x, originalPlayerPosition.y, player.w, player.h);
        }
            
        // Draw player with wrapping effect if clipped at left/right edges
        displayLayer.fill(COLORS[player_color_index][0], COLORS[player_color_index][1], COLORS[player_color_index][2]);
        displayLayer.rect(player.x, player.y, player.w, player.h);

        // Check for wrap
        if (player.x + player.w > W) {
            displayLayer.rect(0, player.y, player.w - (W - player.x), player.h);
        }
    }

    // Draw oldest player trail position on solidMask
    if (!isFinalLevel()) {
        if ((trail.length == TRAIL_MAX_LENGTH) && (Math.round(trail[0].x) !== Math.round(player.x) || Math.round(trail[0].y) !== Math.round(player.y))) {
            solidMask.fill(COLORS[player_color_index][0], COLORS[player_color_index][1], COLORS[player_color_index][2]);
            solidMask.rect(trail[0].x, trail[0].y, player.w, player.h);
            if (DEGUB_MODE) {
                displayLayer.fill(COLORS[(player_color_index+1)%COLORS.length][0], COLORS[(player_color_index+1)%COLORS.length][1], COLORS[(player_color_index+1)%COLORS.length][2]); 
                displayLayer.rect(trail[0].x, trail[0].y, player.w, player.h);
            }
        }
    }

    // Draw player on solidMask to carve out the player's area
    solidMask.fill(COLORS[background_color_index][0], COLORS[background_color_index][1], COLORS[background_color_index][2]);
    solidMask.rect(player.x, player.y, player.w, player.h);

    if (player.x + player.w > W) {
        solidMask.rect(0, player.y, player.w - (W - player.x), player.h);
    }

    // Custom Level Logic
    if (current_level == 0) handleStartScreen();
    if (current_level == TOTAL_LEVELS+3 && levelTimeCounter > 500 && level13Flipped == false) {
        flipHalfOfScreen("right");
        level13Flipped = true;
    }

    handleScreenShake();
    effectIntensity = screenShakeCounter + current_level/2; // Applies to chromatic aberration effect and audio
    drawGUI();

    // Draw Display Layer
    image(displayLayer, screenShakeX, screenShakeY);
    if (!isFinalLevel()) {
        drawRGBSplit(displayLayer, effectIntensity);
        // if (current_level != 0) {
        //     drawGoalSplit(effectIntensity);
        // }
    }

    levelTimeCounter = millis() - levelTimeStart;
    //if (DEGUB_MODE) console.log("Level Time Counter: ", levelTimeCounter);
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

// make sure to load pixels prior to calling this function
function findPlayerPositionAndLength() {
    let player = {x: 0, y: 0, length: 0};
    let start = false;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            // Loop through all pixels from top-left to bottom-right to find the first player pixel
            const idx = 4 * (y * W + x);
            const r = displayLayer.pixels[idx];
            const g = displayLayer.pixels[idx + 1];
            const b = displayLayer.pixels[idx + 2];
            // if (DEGUB_MODE) ("Checking pixel", x, y, r, g, b);
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

// make sure to load pixels prior to calling this function
function findGoalPositionAndSize() {
    let goal = {x: 0, y: 0, w: 0, h: 0};
    let start = false;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const idx = 4 * (y * W + x);
            const r = displayLayer.pixels[idx];
            const g = displayLayer.pixels[idx + 1];
            const b = displayLayer.pixels[idx + 2];
            if (isGoalColor(r, g, b)) {
                start = true;
                goal.x = x;
                goal.y = y;
                goal.w++;
            }
            else if (start) {
                break;
            }
        }
        if (start) {
            const idx = 4 * (y * W + goal.x);
            const r = displayLayer.pixels[idx];
            const g = displayLayer.pixels[idx + 1];
            const b = displayLayer.pixels[idx + 2];
            if (isGoalColor(r, g, b)) {
                goal.h++;
            } else {
                return goal;
            }
        }
    }
    return goal;
}

function handleStartScreen() {
    // Draw key images based on which key is pressed
    if ((keyIsDown(65) || keyIsDown(97)) && !aPressed) { // 'A' or 'a'
        aPressed = true;
		displayLayer.image(keyA, 0, 0, W, H);
        playPing(0.25);
    }
	if ((keyIsDown(78) || keyIsDown(110)) && !nPressed) { // 'N' or 'n'
        nPressed = true;
		displayLayer.image(keyN, 0, 0, W, H);
        playPing(0.25);
    }
	if ((keyIsDown(89) || keyIsDown(121)) && !yPressed) { // 'Y' or 'y'
        yPressed = true;
		displayLayer.image(keyY, 0, 0, W, H);
        playPing(0.25);
	}
    if (aPressed && nPressed && yPressed) {
        loadLevel(current_level + 1);
    }
}

function changeDisplay(oldPassthroughColor, oldBackgroundColor, newBackgroundColor) {
    displayLayer.loadPixels();
    for (let i = 0; i < displayLayer.pixels.length; i += 4) {
        const r = displayLayer.pixels[i];
        const g = displayLayer.pixels[i + 1];
        const b = displayLayer.pixels[i + 2];
        if (isCloseToColor(r, g, b, oldPassthroughColor) || isCloseToColor(r, g, b, oldBackgroundColor)) {
            displayLayer.pixels[i] = newBackgroundColor[0];
            displayLayer.pixels[i + 1] = newBackgroundColor[1];
            displayLayer.pixels[i + 2] = newBackgroundColor[2];
            solidMask.pixels[i] = newBackgroundColor[0];
            solidMask.pixels[i + 1] = newBackgroundColor[1];
            solidMask.pixels[i + 2] = newBackgroundColor[2];
        }
    }
    solidMask.updatePixels();
    displayLayer.updatePixels();
}

function keyPressed() {
    let k = key.toLowerCase();
    // runs once per press
    if (current_level != 0) {
        if (k === 'r') resetLevel();
        if (DEGUB_MODE) {
            if (k === 'n' && !isFinalLevel()) loadLevel(current_level + 1);
            if (k === 'p') loadLevel(current_level - 1);
            if (k === 'f') flipHalfOfScreen("left");
        }
    }
    else {
        if (!audioInitialized) initAudio();
        if ((k !== 'a') && (k !== 'n') && (k !== 'y')) {
            shakeScreen(Math.min(SCREENSHAKE_MAX_FRAMES * 2, SCREENSHAKE_MAX_FRAMES / 2 + anyKeyTries / 4));
            anyKeyTries++;
        }
    }
}

