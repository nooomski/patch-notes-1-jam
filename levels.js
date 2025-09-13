

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
var map_color_index = 0

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