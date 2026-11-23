import { useEffect, useId, useState } from 'react';
import './dream-effects.css';

const HANGING_EYES = [
  { x: '8%', length: '31svh', duration: '5.1s', delay: '-1.1s', from: '-9deg', to: '15deg', size: 88, depth: .74, reverse: true },
  { x: '21%', length: '43svh', duration: '6.4s', delay: '-4.2s', from: '-15deg', to: '8deg', size: 135, depth: 1, reverse: false },
  { x: '34%', length: '23svh', duration: '4.3s', delay: '-3s', from: '-8deg', to: '12deg', size: 73, depth: .63, reverse: true },
  { x: '43%', length: '36svh', duration: '7.7s', delay: '-1.8s', from: '-17deg', to: '11deg', size: 115, depth: .86, reverse: false },
  { x: '55%', length: '17svh', duration: '5.6s', delay: '-5.3s', from: '-10deg', to: '7deg', size: 66, depth: .59, reverse: false },
  { x: '65%', length: '28svh', duration: '6.8s', delay: '-2.7s', from: '-11deg', to: '18deg', size: 106, depth: .81, reverse: true },
  { x: '75%', length: '44svh', duration: '8.1s', delay: '-6.4s', from: '-14deg', to: '10deg', size: 145, depth: 1, reverse: false },
  { x: '86%', length: '22svh', duration: '4.9s', delay: '-.8s', from: '-9deg', to: '13deg', size: 79, depth: .67, reverse: true },
  { x: '95%', length: '34svh', duration: '6.1s', delay: '-4.6s', from: '-13deg', to: '8deg', size: 118, depth: .88, reverse: false },
];

function HangingEye({ x, length, duration, delay, from, to, size, depth, reverse, src }) {
  return <div className="hanging-eye" style={{ left: x, height: length, animationDuration: duration, animationDelay: delay,
    '--swing-from': from, '--swing-to': to, '--eye-size': `${size}px`, '--eye-depth': depth,
    animationDirection: reverse ? 'alternate-reverse' : 'alternate' }}>
    <div className="eye-chain" />
    <img className="eye-charm" src={src} alt="" draggable="false" />
  </div>;
}

export function HangingEyes({ src }) {
  return <div className="hanging-eyes" aria-hidden="true">{HANGING_EYES.map(eye => <HangingEye key={eye.x} {...eye} src={src} />)}</div>;
}

const ROOM_LIGHTS = [
  { aperture: 'M1414 355L1604 250L1649 867L1407 812Z', floor: [1453, 830, 263, 84] },
  { aperture: 'M1058 523L1145 488L1146 747L1057 733Z', floor: [1051, 747, 146, 28] },
  { aperture: 'M888 606L932 594L931 714L887 708Z', floor: [899, 710, 80, 13] },
  { aperture: 'M786 648H808V687H786Z', floor: [796, 688, 42, 8] },
];

// Apertures traced inside the original 1672 × 941 background image.
const FRAME_LIGHTS = [
  'M98 82L162 141L155 323L75 286Z',
  'M321 244L374 263L374 378L320 360Z',
  'M516 53L549 67L527 134L486 120Z',
  'M1268 386L1308 370L1308 459L1269 470Z',
  'M1577 59L1647 7L1650 114L1579 153Z',
  'M526 449L542 461L542 520L526 510Z',
];

function RoomLight({ aperture, floor, index, reduced, gradient, frame = false }) {
  const [lit, setLit] = useState(true);
  useEffect(() => {
    if (reduced) return;
    let timer;
    function schedule() {
      timer = setTimeout(() => { setLit(current => !current); schedule(); }, 380 + Math.random() * (frame ? 1100 : 1250));
    }
    timer = setTimeout(() => { setLit(false); schedule(); }, 240 + index * 90 + Math.random() * 470);
    return () => clearTimeout(timer);
  }, [index, reduced, frame]);
  if (frame) return <g className="frame-light" data-lit={lit || reduced}>
    <path d={aperture} fill="#e4c4dd" fillOpacity=".83" stroke="#f3c3a5" strokeWidth="2" />
  </g>;
  const [cx, cy, rx, ry] = floor;
  return <g className="room-light" data-lit={lit || reduced}>
    <g className="lamp-shade">
      <ellipse {...{ cx, cy, rx, ry }} fill={`url(#${gradient})`} />
      <path d={aperture} fill="#1b0f25" fillOpacity=".96" />
    </g>
    <g className="lamp-glow">
      <ellipse {...{ cx, cy, rx: rx * .7, ry: ry * .7 }} fill="#f7bd6d" opacity=".13" />
      <path d={aperture} fill="#ffc67f" fillOpacity=".17" />
    </g>
  </g>;
}

export function MemoryHall({ src, reduced }) {
  const gradient = useId();
  const frames = useId();
  return <svg className="dream-distance memory-hall" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <radialGradient id={gradient}><stop stopColor="#27152f" stopOpacity=".76" /><stop offset="1" stopColor="#27152f" stopOpacity="0" /></radialGradient>
      <clipPath id={frames}>{FRAME_LIGHTS.map(aperture => <path key={aperture} d={aperture} />)}</clipPath>
    </defs>
    <image className="memory-wallpaper" href={src} width="1672" height="941" />
    {ROOM_LIGHTS.map((light, index) => <RoomLight key={light.aperture} {...light} {...{ index, reduced, gradient }} />)}
    <g clipPath={`url(#${frames})`}>
      {FRAME_LIGHTS.map((aperture, index) => <RoomLight key={aperture} aperture={aperture} index={index + 4} frame reduced={reduced} />)}
    </g>
  </svg>;
}
