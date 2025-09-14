const SCREENSHAKE_INTENSITY = 20;
const SCREENSHAKE_MAX_FRAMES = 20;

let screenShakeX = 0, screenShakeY = 0;
let screenShakeCounter = 0;

let effectIntensity = 0;
let effectIntensityMax = 50;

let leftHalfFlipped = false;
let rightHalfFlipped = false;

function shakeScreen(intensity) {
    screenShakeCounter = intensity;
}

function handleScreenShake() {
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
}

function drawRGBSplit(src, i) {
    // clamp to [0..1], convert to pixel shift
    const shift = i;//Math.round(constrain(i, 0, 1) * 4); // tweak 8
    let multiplier = 0.51;

    push();
    if (shift > 0) {
        blendMode(LIGHTEST);
        const a = 255; // between 0 and 255
        let p = shift * multiplier;

        // RED: nudge right
        tint(255, 0, 0, a);
        image(src, p + random(-p, p), p + random(-p, p));

        // GREEN: nudge left
        tint(0, 255, 0, a);
        image(src, -p - random(-p, p), -p - random(-p, p));

        // BLUE: nudge down
        tint(0, 0, 255, a);
        image(src, random(-p, p), random(-p, p));

        blendMode(BLEND);

        if (current_level == 0 && anyKeyTries > 5) {
            tint(255, 255, 255, 170);
            image(keyHelper, 0, 0);
        }

        noTint();
    }
    pop();
  }

function drawGoalSplit(intensity) {
    const shift = i;//Math.round(constrain(i, 0, 1) * 4); // tweak 8
    let multiplier = 2;

    push();
    if (shift > 0) {
        blendMode(BLEND);
        const a = 255; // between 0 and 255
        let p = 15;//shift * multiplier;

        rectMode(CORNER);
        noStroke();
        fill(COLORS[goal_color_index][0], COLORS[goal_color_index][1], COLORS[goal_color_index][2], a);
        rect(goal.x-goal.w + random(-p, p), goal.y + random(-p, p), goal.w, goal.h);

        blendMode(BLEND);
        noTint();
    }
    pop();
}

// This flips half of a graphic vertically
function flipHalfOfGraphic(src, whichHalf) {
    if (!src || (whichHalf !== "left" && whichHalf !== "right")) return;

    src.loadPixels();

    const w = src.width;
    const h = src.height;

    const startX = (whichHalf === "left") ? 0 : Math.floor(w / 2);
    const endX = startX + Math.floor(w / 2) - 1; // inclusive

    // Swap pixels between top and bottom rows within the selected half only
    for (let yTop = 0, yBottom = h - 1; yTop < yBottom; yTop++, yBottom--) {
        for (let x = startX; x <= endX; x++) {
            const idxTop = 4 * (yTop * w + x);
            const idxBottom = 4 * (yBottom * w + x);

            const r = src.pixels[idxTop];
            const g = src.pixels[idxTop + 1];
            const b = src.pixels[idxTop + 2];
            const a = src.pixels[idxTop + 3];

            src.pixels[idxTop] = src.pixels[idxBottom];
            src.pixels[idxTop + 1] = src.pixels[idxBottom + 1];
            src.pixels[idxTop + 2] = src.pixels[idxBottom + 2];
            src.pixels[idxTop + 3] = src.pixels[idxBottom + 3];

            src.pixels[idxBottom] = r;
            src.pixels[idxBottom + 1] = g;
            src.pixels[idxBottom + 2] = b;
            src.pixels[idxBottom + 3] = a;
        }
    }

    src.updatePixels();
}

function flipHalfOfScreen(whichHalf) {
    flipHalfOfGraphic(displayLayer, whichHalf);
    flipHalfOfGraphic(solidMask, whichHalf)

    shakeScreen(SCREENSHAKE_MAX_FRAMES);
    drawForceField();
    
    // Flip the trail
    if (Array.isArray(trail) && trail.length > 0) {
        const flipLeftHalf = (whichHalf === "left");
        for (let i = 0; i < trail.length; i++) {
            const p = trail[i];
            if (!p) continue;
            if ((flipLeftHalf && p.x < W/2) || (!flipLeftHalf && p.x >= W/2)) {
                p.y = H - p.y - player.h;
            }
        }
    }

    // Flip the goal vertically
    if (goal) {
        goal.y = H - goal.y - goal.h;
    }

    // Flip player's y position as well
    if (whichHalf === "left" && player.x < W/2) player.y = H - player.y - player.h;
    else if (whichHalf === "right" && player.x > W/2) player.y = H - player.y - player.h;
    
    if (whichHalf === "left") leftHalfFlipped = !leftHalfFlipped;
    else if (whichHalf === "right") rightHalfFlipped = !rightHalfFlipped;
}

function drawForceField() {
    guiLayer.stroke(255, 127);
    guiLayer.strokeWeight(4);
    guiLayer.line(W/2, 0, W/2, H);
    guiLayer.noStroke();
}