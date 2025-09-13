// Grain shader by hamoid: https://www.shadertoy.com/view/4ljfRG
precision mediump float;

varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform vec2 uOffset;
uniform float uTime;

void main() {

  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;

  vec4 red = texture2D(uTexture, uv + uOffset);
  vec4 green = texture2D(uTexture, uv);
  vec4 blue = texture2D(uTexture, uv - uOffset);
  
  vec4 color = vec4(red.r, green.g, blue.b, 1.0);
  
  float noiseAmount = .1;
  float n = fract(sin(dot(uv, vec2(uTime+12.9898, 78.233))) * 43758.5453);
  color *= (1.0 - noiseAmount + n * noiseAmount);
  
  // Send the color to the screen
  gl_FragColor = color;
  //gl_FragColor = color;

}