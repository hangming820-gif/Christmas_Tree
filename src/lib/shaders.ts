export const treeVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uPointSize;
  uniform float uWishGlow;

  attribute vec3 color;
  attribute float aScale;
  attribute float aPhase;
  attribute float aTwinkle;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vEnergy;

  void main() {
    vec3 transformed = position;
    float breath = sin(uTime * 0.72 + aPhase * 2.7 + transformed.y * 1.35);
    float drift = cos(uTime * 0.48 + aPhase * 3.1 + transformed.y * 1.9);

    transformed.x += breath * 0.012 + sin(aPhase) * 0.004;
    transformed.z += drift * 0.014;
    transformed.y += sin(uTime * 0.58 + aPhase) * 0.021;

    vec4 modelViewPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;

    float perspective = clamp(310.0 / -modelViewPosition.z, 1.0, 17.0);
    float shimmer = 0.84 + 0.22 * sin(uTime * 1.25 + aPhase * 5.2 + aTwinkle * 3.0);
    float wishScale = 1.0 + uWishGlow * 0.22;
    gl_PointSize = uPointSize * aScale * perspective * uPixelRatio * shimmer * wishScale;

    vColor = color * (0.96 + shimmer * 0.29);
    vAlpha = 0.7 + aTwinkle * 0.3;
    vEnergy = uWishGlow;
  }
`;

export const treeFragmentShader = `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vEnergy;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float distanceToCenter = length(point) * 2.0;
    if (distanceToCenter > 1.0) discard;

    float halo = smoothstep(1.0, 0.06, distanceToCenter);
    float core = smoothstep(0.42, 0.0, distanceToCenter);
    vec3 hotCore = mix(vColor, vec3(1.0, 0.82, 0.88), core * 0.22);
    hotCore += vec3(1.0, 0.72, 0.18) * core * vEnergy * 0.24;

    gl_FragColor = vec4(hotCore, halo * vAlpha * uOpacity);
  }
`;

export const starVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uPointSize;
  uniform float uStarPulse;

  attribute vec3 color;
  attribute float aScale;
  attribute float aPhase;
  attribute float aTwinkle;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 transformed = position;
    transformed.x += sin(uTime * 1.2 + aPhase) * 0.004;
    transformed.y += cos(uTime * 1.05 + aPhase) * 0.004;

    vec4 modelViewPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;

    float perspective = clamp(275.0 / -modelViewPosition.z, 1.0, 16.0);
    float pulse = 1.0 + uStarPulse * 0.055;
    gl_PointSize = uPointSize * aScale * perspective * uPixelRatio * pulse;
    vColor = color * (0.92 + aTwinkle * 0.13 + uStarPulse * 0.12);
    vAlpha = 0.75 + aTwinkle * 0.25;
  }
`;

export const starFragmentShader = `
  uniform float uOpacity;
  uniform float uStarPulse;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float distanceToCenter = length(point) * 2.0;
    if (distanceToCenter > 1.0) discard;

    float glow = smoothstep(1.0, 0.08, distanceToCenter);
    float core = smoothstep(0.38, 0.0, distanceToCenter);
    vec3 color = mix(vColor, vec3(1.0, 0.82, 0.86), core * 0.2);
    color += vec3(1.0, 0.68, 0.12) * core * uStarPulse * 0.18;
    gl_FragColor = vec4(color, glow * vAlpha * uOpacity);
  }
`;

export const ringVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uPointSize;

  attribute vec3 color;
  attribute float aScale;
  attribute float aPhase;
  attribute float aTwinkle;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 transformed = position;
    transformed.y += sin(uTime * 0.82 + aPhase) * 0.018;

    vec4 modelViewPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;

    float perspective = clamp(280.0 / -modelViewPosition.z, 1.0, 14.0);
    float shimmer = 0.78 + sin(uTime * 1.7 + aPhase * 4.0) * 0.24;
    gl_PointSize = uPointSize * aScale * perspective * uPixelRatio * shimmer;
    vColor = color * (0.9 + shimmer * 0.16);
    vAlpha = 0.64 + aTwinkle * 0.34;
  }
`;

export const glowFragmentShader = `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float distanceToCenter = length(point) * 2.0;
    if (distanceToCenter > 1.0) discard;

    float glow = smoothstep(1.0, 0.0, distanceToCenter);
    glow *= glow;
    gl_FragColor = vec4(vColor, glow * vAlpha * uOpacity);
  }
`;

export const snowVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;

  attribute vec3 color;
  attribute float aScale;
  attribute float aPhase;
  attribute float aTwinkle;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 transformed = position;
    float speed = 0.22 + aTwinkle * 0.42;
    transformed.y = mod(position.y + 8.0 - uTime * speed, 16.0) - 8.0;
    transformed.x += sin(uTime * 0.22 + aPhase) * 0.42;
    transformed.z += cos(uTime * 0.17 + aPhase * 1.3) * 0.18;

    vec4 modelViewPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;

    float perspective = clamp(210.0 / -modelViewPosition.z, 0.7, 12.0);
    gl_PointSize = (0.014 + aScale * 0.012) * perspective * uPixelRatio;
    vColor = color;
    vAlpha = 0.24 + aTwinkle * 0.42;
  }
`;

export const snowFragmentShader = `
  uniform float uTime;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float distanceToCenter = length(point) * 2.0;
    if (distanceToCenter > 1.0) discard;
    float softness = smoothstep(1.0, 0.08, distanceToCenter);
    gl_FragColor = vec4(vColor, softness * vAlpha);
  }
`;

export const wishVertexShader = `
  uniform float uPixelRatio;

  attribute vec3 color;
  attribute float aSize;
  attribute float aAlpha;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
    float perspective = clamp(250.0 / -modelViewPosition.z, 1.0, 17.0);
    gl_PointSize = aSize * perspective * uPixelRatio;
    vColor = color;
    vAlpha = aAlpha;
  }
`;

export const wishFragmentShader = `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float distanceToCenter = length(point) * 2.0;
    if (distanceToCenter > 1.0) discard;

    float glow = smoothstep(1.0, 0.0, distanceToCenter);
    float core = smoothstep(0.3, 0.0, distanceToCenter);
    vec3 color = mix(vColor, vec3(1.0), core * 0.34);
    gl_FragColor = vec4(color, glow * vAlpha * uOpacity);
  }
`;
