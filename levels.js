

const COLORS = [
    [239, 100, 93],
    [224, 136, 65],
    [219, 192, 99],
    [121, 134, 46],
    [63, 214, 119],
    [66, 168, 199],
    [14, 15, 66],
    [177, 117, 219]
]

const MAPS = [
    {img: 'Levels/level1.png', color_index: 5},
    {img: 'Levels/level2.png', color_index: 5},
    {img: 'Levels/level3.png', color_index: 1},
    {img: 'Levels/level4.png', color_index: 1},
    {img: 'Levels/level5.png', color_index: 4},
    {img: 'Levels/level6.png', color_index: 2},
]

var current_level = 0
var player_color_index = 0
var passthrough_color_index = 0
var goal_color_index = 0
var background_color_index = 0

const PASSTHROUGH_OFFSET = 1
const GOAL_OFFSET = 2
const BACKGROUND_OFFSET = 5
const TOLERANCE = 10

function preload() {
    displayImg = loadImage(MAPS[current_level].img)
    player_color_index = MAPS[current_level].color_index
    passthrough_color_index = (player_color_index + PASSTHROUGH_OFFSET) % COLORS.length
    goal_color_index = (player_color_index + GOAL_OFFSET) % COLORS.length
    background_color_index = (player_color_index + BACKGROUND_OFFSET) % COLORS.length
}

function loadNextLevel() {
    current_level++
    if (current_level >= MAPS.length) {
        current_level = 0
    }
    try {
        displayImg = loadImage(MAPS[current_level].img, () => {
            player_color_index = MAPS[current_level].color_index
            passthrough_color_index = (player_color_index + PASSTHROUGH_OFFSET) % COLORS.length
            goal_color_index = (player_color_index + GOAL_OFFSET) % COLORS.length
            background_color_index = (player_color_index + BACKGROUND_OFFSET) % COLORS.length
            resetLevel()
        })
    } catch (error) {
        console.error("Error loading level image", error)
    }
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