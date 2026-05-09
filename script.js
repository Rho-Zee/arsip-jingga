const BUBBLE_COUNT = 18;
const BUBBLE_COLORS = [
  // deeper oranges
  "#D86F00",
  "#C85B00",
  "#B94A00",
  // mid oranges
  "#F07A00",
  "#FF7A00",
  "#FF8A1A",
  // brighter oranges
  "#FFA000",
  "#FFB000",
  "#FFC04D",
  // fruit-like oranges
  "#FF8C00",
  "#FF9A1A",
  "#FF7F11",
];

const RIPPLE_COUNT = 22;
const RIPPLE_COLORS = [
  "rgba(255, 192, 77, 0.85)",
  "rgba(255, 176, 0, 0.85)",
  "rgba(255, 138, 26, 0.85)",
  "rgba(255, 122, 0, 0.85)",
];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function setBubbleVars(el) {
  const size = rand(36, 170);
  const alpha = rand(0.28, 0.52);
  const blur = rand(0, 1.8);
  const bubbleColor = pick(BUBBLE_COLORS);

  el.style.setProperty("--size", `${size.toFixed(1)}px`);
  el.style.setProperty("--alpha", `${alpha.toFixed(3)}`);
  el.style.setProperty("--blur", `${blur.toFixed(2)}px`);
  el.style.setProperty("--bubbleColor", bubbleColor);
}

function createBubble({ reducedMotion }) {
  const el = document.createElement("div");
  el.className = "bubble";
  setBubbleVars(el);

  if (reducedMotion) {
    // Static bubble; position assigned by init.
  }

  return el;
}

function svgDataUrl(svg) {
  const encoded = encodeURIComponent(svg)
    .replace(/%0A/g, "")
    .replace(/%20/g, " ");
  return `url("data:image/svg+xml,${encoded}")`;
}

function orangeFruitSvg({ peel = "#FF8C00", peelShade = "#E87400" } = {}) {
  // Simple “orange drawing”: fruit body + subtle segments + pedicel (brown) + one green leaf.
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <radialGradient id="g" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#FFD08A" stop-opacity="0.55"/>
      <stop offset="0.45" stop-color="${peel}" stop-opacity="1"/>
      <stop offset="1" stop-color="${peelShade}" stop-opacity="1"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="0.35"/>
    </filter>
  </defs>

  <!-- pedicel -->
  <path d="M62 18c1-8 6-12 10-14 6-3 8 0 6 4-2 4-8 6-10 10-1 2-1 5-1 8"
        fill="none" stroke="#7A4A1A" stroke-width="7" stroke-linecap="round"/>

  <!-- leaf -->
  <path d="M70 20c14-10 30-10 36-1-10 14-26 18-41 11"
        fill="#2F9E44" stroke="#1B6E2C" stroke-width="3" stroke-linejoin="round"/>
  <path d="M74 22c10-3 18-2 26 1" fill="none" stroke="#1B6E2C" stroke-width="2" stroke-linecap="round"/>

  <!-- fruit -->
  <circle cx="64" cy="72" r="44" fill="url(#g)" filter="url(#soft)"/>
</svg>`;
}

function initBubbles({ reducedMotion }) {
  const layer = document.getElementById("bubbles");
  if (!layer) return;

  const bubbles = [];

  const w = window.innerWidth;
  const h = window.innerHeight;

  // Exactly one “orange fruit” bubble at a time.
  const fruitIdx = Math.floor(Math.random() * BUBBLE_COUNT);

  for (let i = 0; i < BUBBLE_COUNT; i++) {
    const el = createBubble({ reducedMotion });
    layer.appendChild(el);

    const size = parseFloat(getComputedStyle(el).getPropertyValue("--size")) || 80;

    const x = rand(0, Math.max(1, w - size));
    const y = rand(0, Math.max(1, h - size));

    // Turn exactly one bubble into the orange-fruit drawing.
    const makeFruit = i === fruitIdx;
    if (makeFruit) {
      el.classList.add("bubble--fruit");
      el.style.setProperty("--alpha", "1");
      el.style.setProperty("--blur", "0px");

      const peel = pick(["#FF8C00", "#FF9A1A", "#FF7F11", "#FFA000"]);
      const peelShade = pick(["#E87400", "#D86F00", "#CC5C00"]);
      el.style.backgroundImage = svgDataUrl(
        orangeFruitSvg({ peel, peelShade }),
      );
    } else {
      el.classList.remove("bubble--fruit");
      el.style.backgroundImage = "";
    }

    // pixels per second
    const speed = rand(10, 36);
    const angle = rand(0, Math.PI * 2);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const rot = rand(0, Math.PI * 2);
    const omega = makeFruit ? rand(-0.55, 0.55) : 0; // radians/sec; rotate only the orange fruit

    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(
      1,
    )}px, 0) rotate(${rot.toFixed(4)}rad)`;

    bubbles.push({ el, x, y, vx, vy, size, rot, omega });
  }

  if (reducedMotion) return;

  let lastT = performance.now();

  const tick = (t) => {
    const dt = Math.min(0.034, (t - lastT) / 1000); // cap delta
    lastT = t;

    const ww = window.innerWidth;
    const hh = window.innerHeight;

    for (const b of bubbles) {
      const maxX = Math.max(0, ww - b.size);
      const maxY = Math.max(0, hh - b.size);

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.omega * dt;

      // Bounce off edges
      if (b.x <= 0) {
        b.x = 0;
        b.vx = Math.abs(b.vx);
      } else if (b.x >= maxX) {
        b.x = maxX;
        b.vx = -Math.abs(b.vx);
      }

      if (b.y <= 0) {
        b.y = 0;
        b.vy = Math.abs(b.vy);
      } else if (b.y >= maxY) {
        b.y = maxY;
        b.vy = -Math.abs(b.vy);
      }

      b.el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(
        1,
      )}px, 0) rotate(${b.rot.toFixed(4)}rad)`;
    }

    window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(tick);
}

function createTrailLayer() {
  let layer = document.getElementById("trail");
  if (layer) return layer;

  layer = document.createElement("div");
  layer.className = "trail-layer";
  layer.id = "trail";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);
  return layer;
}

function initCursorTrail({ reducedMotion }) {
  if (reducedMotion) return;

  const layer = createTrailLayer();
  const ripples = [];

  for (let i = 0; i < RIPPLE_COUNT; i++) {
    const r = document.createElement("div");
    r.className = "trail-ripple";
    layer.appendChild(r);
    ripples.push(r);
  }

  const state = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    lastX: window.innerWidth / 2,
    lastY: window.innerHeight / 2,
    active: false,
    raf: 0,
    idx: 0,
    lastSpawnAt: 0,
  };

  const onMove = (e) => {
    state.active = true;
    state.targetX = e.clientX;
    state.targetY = e.clientY;
  };

  window.addEventListener("mousemove", onMove, { passive: true });

  const tick = () => {
    // Smooth follow
    state.x += (state.targetX - state.x) * 0.22;
    state.y += (state.targetY - state.y) * 0.22;

    // Speed -> spawn more ripples when moving faster
    const dx = state.x - state.lastX;
    const dy = state.y - state.lastY;
    const speed = Math.hypot(dx, dy);
    state.lastX = state.x;
    state.lastY = state.y;

    const now = performance.now();
    const minInterval = clamp(60 - speed * 2.2, 14, 60); // ms
    if (now - state.lastSpawnAt >= minInterval) {
      state.lastSpawnAt = now;

      const r = ripples[state.idx % ripples.length];
      state.idx += 1;

      const size = clamp(14 + speed * 0.9, 14, 42);
      const alpha = clamp(0.55 - speed * 0.01, 0.18, 0.55);
      const scale = clamp(2.2 + speed * 0.02, 2.2, 3.0);
      const color = pick(RIPPLE_COLORS);

      // Place ripple centered on cursor
      r.style.setProperty("--rx", `${(state.x - size / 2).toFixed(1)}px`);
      r.style.setProperty("--ry", `${(state.y - size / 2).toFixed(1)}px`);
      r.style.setProperty("--rippleSize", `${size.toFixed(1)}px`);
      r.style.setProperty("--rippleAlpha", alpha.toFixed(3));
      r.style.setProperty("--rippleScale", scale.toFixed(3));
      r.style.setProperty("--rippleColor", color);
      r.style.setProperty("--rippleDur", `${clamp(520 - speed * 2, 360, 520)}ms`);

      // Restart animation reliably
      r.style.animation = "none";
      // eslint-disable-next-line no-unused-expressions
      r.offsetHeight;
      r.style.animation = "";
    }

    state.raf = window.requestAnimationFrame(tick);
  };

  state.raf = window.requestAnimationFrame(tick);
}

function init() {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    ?.matches;

  initCursorTrail({ reducedMotion: Boolean(reducedMotion) });
  initBubbles({ reducedMotion: Boolean(reducedMotion) });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

