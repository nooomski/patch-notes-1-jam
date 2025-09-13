// sound params:
let osc = [];
let lfo = [];
let lfoStrengh = [];
let lfoRange = [];
let freqs = [];
let freq1;
let freq2;
let pWidth;

let distortion;
let distBase = 0.1;
let filter;
let reverb;

function initAudio() {
    distortion = new p5.Distortion();
    distortion.set(distBase, '4x');
    filter = new p5.Filter();
    reverb = new p5.Reverb();
    reverb.set(5,10,0);
    reverb.drywet(0.5);
    for (let i=0;i<4;i++) {
        osc[i] = new p5.Oscillator(1,'sine');
        osc[i].amp(0);
    }

    pWidth = 0.7 + random(0.3);
    filter.freq(1500+random(1000));
    
    for (let i=0;i<4;i++) {
        freqs[i] = i%2 ? 90+random(40) : 60+random(20);
        osc[i].freq(i%2 ? freq2:freq1);
        osc[i].pan(-pWidth+(pWidth*2*i/4));
        osc[i].start();
        osc[i].amp(0,1);
        osc[i].amp(0.25, 5+random(10));
        osc[i].connect(distortion);
        lfoRange[i] = 2+random(160);
        lfoStrengh[i] = 500+random(1500);
    }
    distortion.disconnect();
    distortion.connect(reverb);
    reverb.disconnect();
    reverb.connect(filter);
}

function manageAudio() {
    let modu = [986, 1574, 3342, 5321];
    for (i=0;i<4;i++) {
        //let f = i%2 ? freq2:freq1;
        osc[i].freq(freqs[i] + intensity*5 + sin(frameCount%modu[i] / lfoStrengh[i]) * lfoRange[i],1);
    }
    //osc[0].freq(freq1 + sin(frameCount%1000/5390)*2);
    //osc[1].freq(freq2 + sin(frameCount%1574/1230)*3.5,1);
    //osc[2].freq(freq1 + sin(frameCount%7342/2503)*5.1,1);
    //osc[3].freq(freq2 + sin(frameCount%5321/530)*2.6,1);
    distortion.amp(distBase + intensity/intensityMax/2);
}