import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, DoubleSide, MathUtils, RepeatWrapping, SRGBColorSpace } from 'three';
import { CryptProp } from './CryptStonework.jsx';
import { CHAPTERS } from './chapters.js';

// The segment length and angled alcoves follow ITom's corridor layout.
export const SEGMENT_LENGTH = 80;
export const HALL_START = 12.4;
const WIDTH = 6.6;
const HEIGHT = 4.15;
const ANGLE = Math.atan2(1.5, 4.4);
const location = (segment, index) => 10 - segment * SEGMENT_LENGTH + CHAPTERS[index].relativeZ;

export function getDoor(segment, index) {
  const chapter = CHAPTERS[index];
  const side = chapter.side === 'left' ? -1 : 1;
  const rotation = -side * (Math.PI / 2 - ANGLE);
  return { chapter, key: `${segment}/${index}`, segment, index, side, rotation,
    x: side * (WIDTH / 2 - 0.75), z: location(segment, index), normalX: Math.sin(rotation), normalZ: Math.cos(rotation) };
}

export function nearbyDoor(z) {
  const segment = Math.floor((10 - z) / SEGMENT_LENGTH);
  if (segment < 0) return null;
  const index = CHAPTERS.findIndex((_, index) => Math.abs(z - location(segment, index) - 5.4) < 3.35);
  return index < 0 ? null : getDoor(segment, index);
}

export function Box({ at, size, color, glow = false, rotation, map }) {
  return <mesh position={at} rotation={rotation}>
    <boxGeometry args={size} />
    {glow ? <meshBasicMaterial color={color} /> : <meshStandardMaterial color={color} map={map} roughness={0.84} />}
  </mesh>;
}

function artwork(width, height, paint) {
  const canvas = document.createElement('canvas');
  Object.assign(canvas, { width, height });
  paint(canvas.getContext('2d'), width, height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const textures = new Map();
function materialTexture(type) {
  if (textures.has(type)) return textures.get(type);
  const texture = artwork(512, 512, (ctx, w, h) => {
    let seed = type === 'floor' ? 284 : 153;
    const noise = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    ctx.fillStyle = type === 'wall' ? '#827088' : type === 'floor' ? '#5b4758' : '#9f747b';
    ctx.fillRect(0, 0, w, h);
    if (type === 'wall' || type === 'floor') {
      ctx.fillStyle='#2d2934';ctx.fillRect(0,0,w,h);
      for(let row=0;row<8;row++)for(let col=-1;col<5;col++){
        const x=col*128+(row%2)*64, y=row*64;
        ctx.fillStyle=['#645965','#514a58','#776b73','#595563'][Math.floor(noise()*4)];
        ctx.fillRect(x+2,y+2,125,60);
        ctx.fillStyle='#90818a';ctx.fillRect(x+4,y+3,120,2);
        ctx.fillStyle='#403946';ctx.fillRect(x+5,y+58,119,3);
      }
    }
    for (let i = 0; i < 7000; i++) {
      ctx.fillStyle = noise() > 0.45 ? 'rgba(35,29,24,.12)' : 'rgba(225,217,191,.09)';
      ctx.fillRect(noise() * w, noise() * h, 1 + noise() * 9, 1 + noise() * 3);
    }
    for (let i = 0; i < 60; i++) {
      const x = noise() * w, y = noise() * h, r = 5 + noise() * 53;
      const stain = ctx.createRadialGradient(x, y, 1, x, y, r);
      stain.addColorStop(0, 'rgba(63,35,24,.26)'); stain.addColorStop(1, 'rgba(63,35,24,0)');
      ctx.fillStyle = stain; ctx.fillRect(x-r, y-r, r*2, r*2);
    }
  });
  texture.wrapS = texture.wrapT = RepeatWrapping;
  textures.set(type, texture);
  return texture;
}

function surface(type, repeatX, repeatY) {
  const key = `${type}:${repeatX}:${repeatY}`;
  if (!textures.has(key)) {
    const texture = materialTexture(type).clone();
    texture.repeat.set(repeatX, repeatY);
    textures.set(key, texture);
  }
  return textures.get(key);
}

function Plate({ at, width, height, label, sub, accent = '#d9c8a6' }) {
  const map = useMemo(() => {
    const key = `plate:${label}:${sub}:${accent}`;
    if (!textures.has(key)) textures.set(key, artwork(512, 160, ctx => {
      ctx.fillStyle = '#231529'; ctx.fillRect(0, 0, 512, 160);
      ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.strokeRect(7, 7, 498, 146);
      ctx.fillStyle = accent; ctx.textAlign = 'center';
      ctx.font = 'bold 64px sans-serif'; ctx.fillText(label, 256, 84);
      ctx.font = 'bold 20px monospace'; ctx.fillText(sub, 256, 127);
    }));
    return textures.get(key);
  }, [label, sub, accent]);
  return <mesh position={at}><planeGeometry args={[width, height]} /><meshBasicMaterial map={map} toneMapped={false} /></mesh>;
}

function Door({ id, at, rotation = 0, label, sub, color, entry = false, active, opening, onEnter }) {
  const hinge = useRef();
  const otherHinge = useRef();
  const span = entry ? 3.1 : 2.35;
  const leaf = entry ? span / 2 : span;
  const swing = opening === id ? (entry ? 1.47 : 1.38) : 0;
  useFrame((_, dt) => {
    hinge.current.rotation.y = MathUtils.damp(hinge.current.rotation.y, swing, 5.6, dt);
    if (otherHinge.current) otherHinge.current.rotation.y = -hinge.current.rotation.y;
  });
  const click = event => { event.stopPropagation(); if (active) onEnter(id); };
  const panel = (direction, left) => <group position={[direction * leaf / 2, 0, 0]}>
    <Box at={[0, 0, 0]} size={[leaf - .035, 3.22, .14]} color={entry ? '#544853' : '#73616b'} map={materialTexture('door')} />
    {Array.from({ length: 5 }, (_, i) => <Box key={i} at={[(i - 2) * leaf / 5, 0, .078]} size={[.025, 3.19, .02]} color="#3b233a" />)}
    <mesh position={[0,.47,.14]} scale={[1,1.3,.33]}>
      <icosahedronGeometry args={[entry?.20:.24,0]}/><meshStandardMaterial color="#ae8c70" metalness={.38} roughness={.62}/>
    </mesh>
    <mesh position={[0,.22,.19]}>
      <torusGeometry args={[entry?.16:.19,.037,6,14]}/><meshStandardMaterial color="#ac8b67" metalness={.45} roughness={.58}/>
    </mesh>
    {[-1.15,.98].map(y=><group key={y} position={[0,y,.115]}>
      <Box at={[0,0,0]} size={[leaf-.08,.13,.06]} color="#312d36"/>
      {[-.33,.33].map(x=><Box key={x} at={[x*leaf,0,.045]} size={[.07,.07,.035]} color="#a4866e"/>)}
    </group>)}
    <Box at={[0, -.89, .09]} size={[leaf - .14, .49, .035]} color="#4f3345" />
    <Box at={[(left ? 1 : -1) * (leaf / 2 - .19), -.31, .155]} size={[.22, .065, .09]} color="#ca995d" />
  </group>;
  return <group position={at} rotation={[0, rotation, 0]}>
    {!entry && <mesh position={[0, 0, .028]}>
      <planeGeometry args={[span + .03, 3.37]} />
      <meshBasicMaterial color="#000000" fog={false} toneMapped={false} />
    </mesh>}
    <Box at={[-span / 2 - .095, 0, .05]} size={[.21, 3.54, .30]} color="#6d475f" />
    <Box at={[span / 2 + .095, 0, .05]} size={[.21, 3.54, .30]} color="#6d475f" />
    <Box at={[0, 1.73, .05]} size={[span + .4, .18, .30]} color="#926345" />
    <Box at={[0, 1.58, .23]} size={[span - .14, .035, .042]} color={color} glow />
    {!entry && <Plate at={[0, 2.02, .045]} width={entry ? 2.8 : 1.65} height={entry ? .56 : .45} label={label} sub={sub} accent={color} />}
    <group ref={hinge} position={[-span / 2, 0, .09]} onClick={click}>
      {panel(1, true)}
    </group>
    {entry && <group ref={otherHinge} position={[span / 2, 0, .09]} onClick={click}>{panel(-1, false)}</group>}
    {entry && active && <mesh position={[0, 0, .31]} onClick={click}>
      <planeGeometry args={[span + .4, 3.54]} />
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </mesh>}
    {active && <pointLight position={[0, 1, 1.5]} color={color} intensity={entry ? 12 : 13} distance={7} />}
  </group>;
}

export function CryptEntrance({ active, opening, onEnter }) {
  return <group>
    {[-1,1].map(side=><group key={side}>
      <Box at={[side*2.58,2,14]} size={[1.8,4,.52]} color="#b9a9ad" map={materialTexture('wall')}/>
      <CryptProp kind="reliquary" at={[side*2.55,0,14.67]} turn={-side*.32}/>
      <CryptProp kind="brazier" at={[side*2.12,0,15.92]}/>
      <pointLight position={[side*2.12,1.64,15.94]} color="#ffa469" intensity={12} distance={7}/>
    </group>)}
    <CryptProp kind="arch" at={[0,0,14.46]}/>
    <Box at={[0,3.82,14]} size={[3.65,.64,.36]} color="#635961" map={materialTexture('wall')}/>
    <Door id="entry" at={[0,1.65,14.22]} entry label="NIGHTMARE" sub="THE UNDERCRYPT" color="#ecc19a" active={active} opening={opening} onEnter={onEnter}/>
  </group>;
}

function Wall({ x1, x2, z1, z2 }) {
  const length = Math.hypot(x2 - x1, z2 - z1);
  const turn = Math.atan2(z1 - z2, x2 - x1);
  return <mesh position={[(x1 + x2) / 2, HEIGHT / 2, (z1 + z2) / 2]} rotation={[0, turn, 0]}>
    <planeGeometry args={[length, HEIGHT]} /><meshStandardMaterial map={surface('wall', Math.max(1, Math.round(length / 4)), 1)} side={DoubleSide} roughness={.96} />
  </mesh>;
}

function WallSide({ side, start, end, doors }) {
  const outer = side * WIDTH / 2;
  const inner = outer - side * 1.5;
  let cursor = start;
  const spans = [];
  for (const door of doors) {
    const front = door.z + 2.2, rear = door.z - 2.2;
    spans.push([outer, outer, cursor, front], [outer, inner, front, rear], [inner, outer, rear, rear - 1.15]);
    cursor = rear - 1.15;
  }
  spans.push([outer, outer, cursor, end]);
  return spans.map(([x1, x2, z1, z2], index) => <Wall key={index} {...{x1, x2, z1, z2}} />);
}

export default function CorridorSegment({ segmentIndex, onDoorEnter, zClip, openingDoorId, activeDoorId }) {
  const start = Math.min(10 - segmentIndex * SEGMENT_LENGTH, zClip);
  const end = 10 - (segmentIndex + 1) * SEGMENT_LENGTH;
  const depth = start - end;
  if (depth <= 0) return null;
  const doors = segmentIndex < 0 ? [] : CHAPTERS.map((_, index) => getDoor(segmentIndex, index));
  const fixtures = Array.from({ length: Math.floor(depth / 8) }, (_, index) => start - 3.8 - index * 8);

  return <group>
    <mesh position={[0, -.004, (start + end) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[WIDTH, depth]} /><meshStandardMaterial map={surface('floor', 2, Math.round(depth / 3.3))} roughness={.72} />
    </mesh>
    <Box at={[0, HEIGHT + .05, (start + end) / 2]} size={[WIDTH, .1, depth]} color="#453047" />
    {[-1, 1].map(side => <WallSide key={side} {...{side, start, end}} doors={doors.filter(door => door.side === side)} />)}
    {fixtures.map((z,i)=>{
      if(doors.some(d=>Math.abs(d.z-z)<3.7) || (segmentIndex<0 && Math.abs(z-14)<5))return null;
      const side=i%2?1:-1;
      return <group key={z}>
        <CryptProp kind="arch" at={[0,0,z]}/>
        <CryptProp kind="brazier" at={[side*2.59,0,z+.55]}/>
        <CryptProp kind={i%3===1?'prisoner':'reliquary'} at={[-side*2.93,0,z+.8]} turn={side*Math.PI/2}/>
      </group>;
    })}
    {doors.map(door => <Door key={door.key} id={door.key} at={[door.x, 1.65, door.z]} rotation={door.rotation}
      label={door.chapter.age} sub={'DREAM ' + String(door.index + 1).padStart(2, '0')} color={door.chapter.color}
      active={activeDoorId === door.key} opening={openingDoorId} onEnter={onDoorEnter} />)}
  </group>;
}
