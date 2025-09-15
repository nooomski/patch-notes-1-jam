const GUI_COLOR = [241, 241, 241];

let iconGoal;
let iconPassthrough;

function drawGUI() {
    // === GUI ===
    // Draw Time & handle start screen
    displayLayer.fill(GUI_COLOR);
    displayLayer.textSize(40);

    // Draw Time
    if (startTime > 0) {
        let totalSeconds = millis() / 1000;
        let t = round(totalSeconds-startTime);
        if (finalTime > 0) {
            t = finalTime;
        }

        let tx = 32, ty = 33;

        // Draw on display layer to show the user the time
        guiLayer.fill(GUI_COLOR);
        guiLayer.textSize(32);
        guiLayer.textAlign(LEFT, TOP);
        guiLayer.text("TIME: " + t, tx,ty);
    }
    if (player.isStuck) {
        guiLayer.fill(GUI_COLOR, 15);
        guiLayer.textSize(32);
        guiLayer.textAlign(CENTER, TOP);
        guiLayer.text('"R"', W/2,33);
    }

    // Draw color rectangles for goal and passthrough
    guiLayer.stroke(GUI_COLOR);
    guiLayer.strokeWeight(2);
    
    // Goal color rectangle & icon
    if (current_level != 0 && !isFinalLevel()) {
        guiLayer.image(iconGoal, W-54, 33, 32, 32);
        guiLayer.fill(COLORS[goal_color_index]);
        guiLayer.rect(W-96, 33, 32, 32);
    }
    
    // Passthrough color rectangle & icon
    if (current_level >= 4 && !isFinalLevel()) {
        guiLayer.image(iconPassthrough, W-55, 80, 32, 32);
        guiLayer.fill(COLORS[passthrough_color_index]);
        guiLayer.rect(W-96, 80, 32, 32);
    }
    
    guiLayer.noStroke();

    // Draw GUI Layer on display and solid mask, respecting vertical half flips
    const leftFlip = (typeof leftHalfFlipped !== 'undefined') && leftHalfFlipped;
    const rightFlip = (typeof rightHalfFlipped !== 'undefined') && rightHalfFlipped;

    // Draw to displayLayer
    if (leftFlip) {
        displayLayer.push();
        displayLayer.translate(0, H);
        displayLayer.scale(1, -1);
        displayLayer.image(guiLayer, 0, 0, W/2, H, 0, 0, W/2, H);
        displayLayer.pop();
    } else {
        displayLayer.image(guiLayer, 0, 0, W/2, H, 0, 0, W/2, H);
    }
    if (rightFlip) {
        displayLayer.push();
        displayLayer.translate(0, H);
        displayLayer.scale(1, -1);
        displayLayer.image(guiLayer, W/2, 0, W/2, H, W/2, 0, W/2, H);
        displayLayer.pop();
    } else {
        displayLayer.image(guiLayer, W/2, 0, W/2, H, W/2, 0, W/2, H);
    }

    // Draw to solidMask
    if (leftFlip) {
        solidMask.push();
        solidMask.translate(0, H);
        solidMask.scale(1, -1);
        solidMask.image(guiLayer, 0, 0, W/2, H, 0, 0, W/2, H);
        solidMask.pop();
    } else {
        solidMask.image(guiLayer, 0, 0, W/2, H, 0, 0, W/2, H);
    }
    if (rightFlip) {
        solidMask.push();
        solidMask.translate(0, H);
        solidMask.scale(1, -1);
        solidMask.image(guiLayer, W/2, 0, W/2, H, W/2, 0, W/2, H);
        solidMask.pop();
    } else {
        solidMask.image(guiLayer, W/2, 0, W/2, H, W/2, 0, W/2, H);
    }
}

function clearGUI() {
    guiLayer.clear();
}