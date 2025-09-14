

const COLORS = [
    [239, 69, 66],
    [224, 136, 65],
    [219, 192, 99],
    [121, 134, 46],
    [63, 214, 119],
    [66, 168, 199],
    [14, 15, 66],
    [177, 117, 219]
]

const MAPS = [
    {img: 'Levels/start.png', color_index: 5},
    {img: 'Levels/level1.png', color_index: 5},
    {img: 'Levels/level2.png', color_index: 5},
    {img: 'Levels/level3.png', color_index: 0},
    {img: 'Levels/level4.png', color_index: 0},
    {img: 'Levels/level5.png', color_index: 0},
    {img: 'Levels/level6.png', color_index: 3},
    {img: 'Levels/level7.png', color_index: 1},
    {img: 'Levels/level8.png', color_index: 0},
    {img: 'Levels/levelPlaceHolder.png', color_index: 5},
    {img: 'Levels/level10.png', color_index: 5},
    {img: 'Levels/level1.png', color_index: 5},
    {img: 'Levels/level2.png', color_index: 5},
    {img: 'Levels/level3.png', color_index: 0},
    {img: 'Levels/level4.png', color_index: 0},
    {img: 'Levels/level5.png', color_index: 3},
    {img: 'Levels/level6.png', color_index: 1},
    {img: 'Levels/level7.png', color_index: 0},
    {img: 'Levels/levelPlaceHolder.png', color_index: 5},
    {img: 'Levels/levelPlaceHolder.png', color_index: 5},
    {img: 'Levels/end.png', color_index: 5},
]

var current_level = 0
var player_color_index = 0
var passthrough_color_index = 0
var goal_color_index = 0
var background_color_index = 0

const PASSTHROUGH_OFFSET = 1
const GOAL_OFFSET = 2
const BACKGROUND_OFFSET = 5
const TOLERANCE = 8

function updateColorScheme(player_index) {
    player_color_index = player_index % COLORS.length
    passthrough_color_index = (player_index + PASSTHROUGH_OFFSET) % COLORS.length
    goal_color_index = (player_index + GOAL_OFFSET) % COLORS.length
    background_color_index = (player_index + BACKGROUND_OFFSET) % COLORS.length
    const bg = COLORS[background_color_index];
    document.body.style.setProperty('background-color', `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`);
}

function loadNextLevel() {
    if (current_level == 0) {
        startTime = floor(millis()) / 1000;
        anyKeyTries = 0;
    }
    resetAudio();
    if (current_level != 0) playPing(0.10);

    current_level++
    if (current_level >= MAPS.length) {
        console.log("No more levels")
        return
    }
    console.log("Loading level", current_level)
    try {
        // to remove the suffix once the levels are done (had caching issues)
        displayImg = loadImage(MAPS[current_level].img + "?v=" + Math.random(), () => {
            console.log(passthroughHit)
            player_color_index = MAPS[current_level].color_index
            updateColorScheme(player_color_index)
            resetLevel()
            if (isFinalLevel()) {
                let currentTime = floor(millis() / 1000);
                finalTime = currentTime - startTime;
            }
            console.log(passthroughHit)
            console.log("Level image loaded", current_level)
        })
    } catch (error) {
        console.error("Error loading level image", error)
    }
    resetLevelCounter();
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

    updateColorScheme(MAPS[current_level].color_index);

    if (current_level != 0) {
        displayLayer.loadPixels();
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

        goal = findGoalPositionAndSize();
        if (goal) {
            console.log("Goal found in display layer", goal);
        } else {
            console.error('Goal not found in display layer');
        }
    }  
    player.vx = 0;  player.vy = 0;
    player.onGround = false;
    player.isStuck = false;

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
    image(displayLayer, -SCREENSHAKE_INTENSITY/2+screenShakeX, -SCREENSHAKE_INTENSITY/2+screenShakeY);
    goalHit = false;
    passthroughHit = false;
    setTimeout(() => { loadingNextLevel = false; }, 1000);

    shakeScreen(SCREENSHAKE_MAX_FRAMES);

    resetLevelCounter();
}

function isPlayerColor(r, g, b) {
    const target = COLORS[player_color_index];
    return isCloseToColor(r, g, b, target);
}

function isPassthroughColor(r, g, b) {
    const target = COLORS[passthrough_color_index];
    return isCloseToColor(r, g, b, target);
}

function isGoalColor(r, g, b) {
    const target = COLORS[goal_color_index];
    return isCloseToColor(r, g, b, target);
}

function isBackgroundColor(r, g, b) {
    const target = COLORS[background_color_index];
    return isCloseToColor(r, g, b, target);
}

function isCloseToColor(r, g, b, target) {
    if (
        Math.abs(r - target[0]) <= TOLERANCE &&
        Math.abs(g - target[1]) <= TOLERANCE &&
        Math.abs(b - target[2]) <= TOLERANCE
    ) {
        return true;
    }
    return false;
}

function resetLevelCounter() {
    levelTimeStart = millis();
    levelTimeCounter = 0;
}

function isFinalLevel() {
    return current_level == MAPS.length - 1;
}