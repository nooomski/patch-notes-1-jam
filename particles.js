class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = random(-4, 4);
        this.vy = random(-2,-0.5);
        this.color = color;
        this.life = random(10, 20);
    }
    update() {
        this.vx *= 0.95;
        this.vy += GRAVITY/4;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    draw(dest) {
        dest.fill(this.color, this.life/20);
        dest.ellipse(this.x, this.y, 1);
    }
}

function manageParticles() {
    if (guiLayer) {
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw(guiLayer);
            if (particles[i].life < 0) {
                particles.splice(i, 1);
            }
        }
    }
}