import { useEffect, useRef } from 'react';

const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export default function SandReveal({ reduced, phase, onPhase }) {
  const canvas = useRef();
  const touchedAt = useRef(null);
  const state = useRef('flowing');

  function touch() {
    if (touchedAt.current !== null) return;
    touchedAt.current = performance.now();
    state.current = reduced ? 'revealed' : 'gathering';
    onPhase(state.current);
  }

  useEffect(() => {
    const surface = canvas.current;
    const context = surface.getContext('2d');
    if (!context) return;
    const count = innerWidth < 640 ? 16000 : 29000;
    const particles = new Float32Array(count * 5);
    let seed = 731;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < particles.length; i++) particles[i] = random();
    let width, height, frame, previous = 0;
    const resize = () => {
      const bounds = surface.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      const ratio = Math.min(devicePixelRatio, 1.5);
      surface.width = Math.round(width * ratio); surface.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(surface);
    resize();
    const palette = ['#8e552c', '#c68b42', '#e6ba67', '#ffe3a1'];
    const paint = now => {
      frame = requestAnimationFrame(paint);
      if (now - previous < 30) return;
      previous = now;
      context.clearRect(0, 0, width, height);
      const elapsed = touchedAt.current === null ? -1 : (now - touchedAt.current) / 1000;
      if (elapsed >= 1.15 && state.current === 'gathering') {
        state.current = 'revealing'; onPhase('revealing');
      }
      if (elapsed > 3.85 || (reduced && touchedAt.current !== null)) {
        state.current = 'revealed'; onPhase('revealed'); cancelAnimationFrame(frame); return;
      }
      const time = reduced ? 3 : now * .001;
      const gather = elapsed < 0 ? 0 : ease(elapsed / 1.15);
      const scatter = elapsed < 1.15 ? 0 : ease((elapsed - 1.15) / 2.7);
      const radius = Math.min(width * .34, height * .29);
      const cloudSize = 1 - gather * .5 + scatter * 4.4;
      const alpha = 1 - ease(scatter);
      const glow = context.createRadialGradient(width * .46, height * .40, 0, width * .5, height * .45, radius * cloudSize);
      glow.addColorStop(0, '#e1ae4b29');
      glow.addColorStop(.62, '#b47b2f16');
      glow.addColorStop(1, '#99632800');
      context.globalAlpha = alpha * alpha;
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
      for (let color = 0; color < palette.length; color++) {
        context.fillStyle = palette[color];
        for (let i = color; i < count; i += 4) {
          const offset = i * 5;
          const a = particles[offset], b = particles[offset + 1], c = particles[offset + 2];
          const d = particles[offset + 3], e = particles[offset + 4];
          const latitude = Math.acos(2 * b - 1) - Math.PI / 2;
          const longitude = a * Math.PI * 2 + time * (.18 + e * .24) + gather * 3.6;
          const wave = 1 + .14 * Math.sin(longitude * 3 + time) * Math.cos(latitude * 4);
          const r = Math.cbrt(c) * radius * cloudSize * wave;
          let x = Math.cos(longitude) * Math.cos(latitude) * r;
          let y = Math.sin(latitude) * r * .83 + Math.sin(longitude * 2 + time * .7) * radius * .08;
          const z = Math.sin(longitude) * Math.cos(latitude) * r;
          x += Math.cos(a * 27) * radius * scatter * (1 + e);
          y += Math.sin(a * 27) * radius * scatter * 1.1;
          const perspective = 1 / Math.max(.62, 1 + z / (radius * 5));
          const size = (.6 + d * 1.3) * perspective * Math.min(1.3, width / 750);
          context.globalAlpha = alpha * (.3 + .65 * d) * (z < 0 ? .7 : 1);
          context.fillRect(width * .5 + x * perspective, height * .45 + y * perspective, size, size);
        }
      }
      context.globalAlpha = 1;
      if (reduced) cancelAnimationFrame(frame);
    };
    frame = requestAnimationFrame(paint);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [reduced, onPhase]);

  return <div className={'sand-reveal sand-' + phase}>
    <canvas ref={canvas} className="flowing-sand" aria-hidden="true" />
    {phase === 'flowing' && <button type="button" className="sand-touch-zone" aria-label="触摸沙子"
      onPointerMove={event => { if (event.pointerType === 'mouse') touch(); }}
      onPointerDown={event => { event.stopPropagation(); touch(); }} onClick={touch}>
      <span>触摸沙子</span>
    </button>}
  </div>;
}
