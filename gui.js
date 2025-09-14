function drawGUI() {
    // === GUI ===
    // Draw Time & handle start screen
    displayLayer.fill(255);
    displayLayer.textSize(40);

    if (startTime > 0) {
        let totalSeconds = millis() / 1000;
        let t = round(totalSeconds-startTime);
        if (finalTime > 0) {
            t = finalTime;
        }

        let tx = 20, ty = 20;

        // Draw on display layer to show the user the time
        guiLayer.fill(255);
        guiLayer.textSize(40);
        guiLayer.textAlign(LEFT, TOP);
        guiLayer.text("TIME: " + t, tx,ty);
    }
    if (player.isStuck) {
        guiLayer.fill(255, 15);
        guiLayer.textSize(40);
        guiLayer.textAlign(RIGHT, TOP);
        guiLayer.text('"R"', W-40,20);
    }

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