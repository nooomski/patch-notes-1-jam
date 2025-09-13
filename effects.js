const SCREENSHAKE_INTENSITY = 20;
const SCREENSHAKE_MAX_FRAMES = 20;

let screenShakeX = 0, screenShakeY = 0;
let screenShakeCounter = 0;

let effectIntensity = 0;
let effectIntensityMax = 50;

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