

const COLORS = [
    [255, 0, 0], // RED
    [255, 128, 0], // ORANGE
    [255, 255, 0], // YELLOW
    [0, 255, 0], // GREEN
    [0, 255, 255], // CYAN
    [0, 0, 255], // BLUE
    [255, 0, 255], // MAGENTA
    [0, 0, 0] // BLACK
]

const MAPS = [
    {img: 'level.png', color_index: 4},
    {img: 'level.png', color_index: 4},
    {img: 'level.png', color_index: 4},
]

var current_level = 0
var map_color_index = 4

const PASSTHROUGH_OFFSET = 1
const GOAL_OFFSET = 2
const BACKGROUND_OFFSET = 5

function preload() {
    displayImg = loadImage(MAPS[current_level].img)
    map_color_index = MAPS[current_level].color_index
}

function loadNextLevel() {
    current_level++
    if (current_level >= MAPS.length) {
        current_level = 0
    }
    try {
        displayImg = loadImage(MAPS[current_level].img, () => {
            map_color_index = MAPS[current_level].color_index
            resetLevel()
        })
    } catch (error) {
        console.error("Error loading level image", error)
    }
}

function isPlayerColor(r, g, b) {
    if (r === COLORS[map_color_index][0] && g === COLORS[map_color_index][1] && b === COLORS[map_color_index][2]) {
        return true
    }
    return false
}

function isPassthroughColor(r, g, b) {
    let passthrough_color_index = (map_color_index + PASSTHROUGH_OFFSET) % COLORS.length
    if (r === COLORS[passthrough_color_index][0] && g === COLORS[passthrough_color_index][1] && b === COLORS[passthrough_color_index][2]) {
        return true
    }
    return false
}

function isGoalColor(r, g, b) {
    let goal_color_index = (map_color_index + GOAL_OFFSET) % COLORS.length
    if (r === COLORS[goal_color_index][0] && g === COLORS[goal_color_index][1] && b === COLORS[goal_color_index][2]) {
        return true
    }
    return false
}

function isBackgroundColor(r, g, b) {
    let background_color_index = (map_color_index + BACKGROUND_OFFSET) % COLORS.length
    if (r === COLORS[background_color_index][0] && g === COLORS[background_color_index][1] && b === COLORS[background_color_index][2]) {
        return true
    }
    return false
}