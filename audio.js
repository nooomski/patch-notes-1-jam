// sound params:
let audioInitialized = false;
let osc = [];
let ping;
let lfo = [];
let lfoStrength = [];
let lfoRange = [];
let freqs = [];
let freq1;
let freq2;
let pWidth;

let distortion;
let distBase = 0.0;
let filter;
let reverb;

// Initialize the audio parameters
function initAudio() {
    audioInitialized = true;
    distortion = new p5.Distortion();
    distortion.set(distBase, '4x');
    filter = new p5.Filter();
    reverb = new p5.Reverb();
    reverb.set(5,10,0);
    reverb.drywet(0.5);
    for (let i=0;i<6;i++) {
        osc[i] = new p5.Oscillator(1,'sine');
        osc[i].amp(0);
    }
    
    distortion.disconnect();
    distortion.connect(reverb);
    reverb.disconnect();
    reverb.connect(filter);

    ping = new p5.Oscillator(1,'sine');
    ping.amp(0);
    ping.freq(440);

    resetAudio();
}

function resetAudio() {
    pWidth = 0.7 + random(0.3);
    filter.freq(1500+random(1000));
    
    // Drones
    for (let i=0;i<4;i++) {
        freqs[i] = i%2 ? 90+random(40) : 60+random(20);
        osc[i].freq(i%2 ? freq2:freq1);
        osc[i].pan(-pWidth+(pWidth*2*i/(4)));
        osc[i].start();
        osc[i].amp(0.20, 0.1);
        osc[i].connect(distortion);
        lfoRange[i] = 2+random(30);
        lfoStrength[i] = 5000+random(15000);
    }

    // Glitch sound
    for (let i=4;i<6;i++) {
        freqs[i] = i%2 ? 200+random(200) : 100+random(400);
        osc[i].freq(i%2 ? freq2:freq1);
        osc[i].start();
        osc[i].amp(0, 1);
        osc[i].amp(0.50, 0.1);
        osc[i].connect(distortion);
        lfoRange[i] = 2+random(30);
        lfoStrength[i] = 5000+random(15000);
    }

    if (isFinalLevel()) {
        osc[0].freq(523.24);
        osc[0].disconnect(distortion);
        osc[1].freq(784);
        osc[1].disconnect(distortion);
        osc[2].freq(1174.64);
        osc[2].disconnect(distortion);
        osc[3].freq(1396.92);
        osc[3].disconnect(distortion);
        //distortion.amp(0);
    }
}

// This moves the audio frequency and distortion amplitude based on the effect intensity, call every frame
function manageAudio() {
    if (!isFinalLevel()) {
        let modu = [986, 1574, 3342, 5321];
        for (i=0;i<4;i++) {
            osc[i].freq(freqs[i] + sin(frameCount%modu[i] / lfoStrength[i]) * lfoRange[i],1);
        }
        distortion.amp(distBase + effectIntensity/effectIntensityMax/2);
    }
    // else {
    //     console.log("game over");
    // }
}

function playPing(v) {
    ping.freq(200 + random(200));
    ping.amp(v,0.05);
    ping.start();
    ping.amp(0,0.2);   
}