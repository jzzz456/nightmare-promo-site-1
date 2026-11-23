import { Component, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { MathUtils, Vector3 } from 'three';
import InfiniteCorridorManager from './InfiniteCorridorManager.jsx';
import { CryptEntrance, HALL_START, nearbyDoor } from './CorridorSegment.jsx';
import DreamRoom from './DreamRoom.jsx';
import { art } from './chapters.js';
import './style.css';

const ENTRY_Z = 20.8;
const clamp = MathUtils.clamp;

function Eye() {
  return <svg viewBox="0 0 40 24" fill="none" aria-hidden="true">
    <path d="M1 12C6 5 12.5 2 20 2s14 3 19 10c-5 7-11.5 10-19 10S6 19 1 12Z" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="20" cy="12" r="5.4" fill="currentColor" />
  </svg>;
}

class SceneBoundary extends Component {
  state = { unavailable: false };
  static getDerivedStateFromError() { return { unavailable: true }; }
  render() {
    return this.state.unavailable ? this.props.fallback : this.props.children;
  }
}

function HallCamera({ phase, travel, openingDoor, reduced, onNear, intro }) {
  const gaze = useRef(new Vector3(0, 1.76, 14));
  const goal = useRef(new Vector3());
  const lastNear = useRef(null);
  const introReveal = useRef(0);
  useFrame(({ camera }, dt) => {
    const blend = reduced ? 1 : 1 - Math.exp(-dt * 5.1);
    let x = 0, z = ENTRY_Z;
    goal.current.set(0, 1.76, 14);
    if (phase === 'entryOpening') {
      z = HALL_START;
      goal.current.set(0, 1.65, 3);
    }
    if (phase === 'hall') {
      travel.current.position = MathUtils.lerp(travel.current.position, travel.current.target, blend);
      z = travel.current.position;
      const door = nearbyDoor(z);
      if ((door?.key ?? null) !== lastNear.current) {
        lastNear.current = door?.key ?? null;
        onNear(door);
      }
      const attraction = door ? 1 - Math.abs(z - door.z - 5.4) / 3.35 : 0;
      goal.current.set(door ? door.x * MathUtils.smoothstep(attraction, 0, 1) : 0, 1.67, z - 7.2);
    }
    if (phase === 'roomOpening' && openingDoor) {
      x = openingDoor.x + openingDoor.normalX * .46;
      z = openingDoor.z + openingDoor.normalZ * .46;
      goal.current.set(openingDoor.x - openingDoor.normalX, 1.66, openingDoor.z - openingDoor.normalZ);
    }
    if (intro.current) {
      const target = phase === 'entryOpening' ? 1 : phase === 'hall' ? MathUtils.smoothstep(z, .8, 3.6) : 0;
      introReveal.current = reduced || Math.abs(introReveal.current - target) < .001
        ? target : MathUtils.damp(introReveal.current, target, 8, dt);
      const reveal = introReveal.current;
      const scale = (.14 + .86 * MathUtils.smootherstep(reveal, 0, 1)) * clamp(1.04 - z * .012, .88, 1.04);
      intro.current.style.visibility = reveal > .005 ? 'visible' : 'hidden';
      intro.current.style.opacity = reveal;
      intro.current.style.setProperty('--depth', reduced ? '1' : String(scale));
    }
    const positionBlend = phase === 'hall' ? 1 : blend;
    camera.position.x = MathUtils.lerp(camera.position.x, x, positionBlend);
    camera.position.y = 1.59;
    camera.position.z = MathUtils.lerp(camera.position.z, z, positionBlend);
    gaze.current.lerp(goal.current, blend);
    camera.lookAt(gaze.current);
  });
  return null;
}

function Hall({ phase, travel, nearby, selected, reduced, onNear, onDoor, intro }) {
  const starting = phase === 'entry' || phase === 'entryOpening';
  const opening = phase === 'entryOpening' ? 'entry' : phase === 'roomOpening' ? selected.key : null;
  return <>
    <color attach="background" args={['#1b1025']} />
    <fog attach="fog" args={['#1b1025', 6, 32]} />
    <ambientLight intensity={.95} color="#d7b5dc" />
    <hemisphereLight intensity={.85} color="#dfaec4" groundColor="#302236" />
    <InfiniteCorridorManager entranceOnly={phase === 'entry'} clipSegmentNeg1 onDoorEnter={onDoor} activeDoorId={nearby?.key} openingDoorId={opening} />
    {starting && <CryptEntrance active={phase === 'entry'} opening={opening} onEnter={onDoor} />}
    <MovingLight />
    <HallCamera phase={phase} travel={travel} openingDoor={selected} reduced={reduced} onNear={onNear} intro={intro} />
  </>;
}

function MovingLight() {
  const light = useRef();
  useFrame(({ camera }) => {
    light.current.position.set(-.7, 3.5, camera.position.z - 4.5);
  });
  return <pointLight ref={light} position={[-.7, 3.5, 14]} color="#edd5b1" intensity={27} distance={16} />;
}

function App() {
  const [phase, setPhase] = useState('entry');
  const [nearby, setNearby] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const view = useRef();
  const travel = useRef({ position: HALL_START, target: HALL_START });
  const intro = useRef();
  const gesture = useRef(null);
  const draggedAt = useRef(-1000);
  const room = phase === 'room';
  const chapter = (room ? selected : nearby)?.chapter;
  const area = phase === 'entry' || phase === 'entryOpening' ? 'entry' : room ? 'room' : 'hall';

  function enter(id) {
    if (performance.now() - draggedAt.current < 180) return;
    if (phase === 'entry' && id === 'entry') setPhase('entryOpening');
    if (phase === 'hall' && id && id === nearby?.key) {
      setSelected(nearby);
      setPhase('roomOpening');
    }
  }

  function move(distance) {
    if (phase !== 'hall') return;
    const position = travel.current.position;
    travel.current.target = clamp(travel.current.target - distance, position - 18, Math.min(HALL_START, position + 18));
  }

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(preference.matches);
    preference.addEventListener('change', onChange);
    return () => preference.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (phase !== 'entryOpening' && phase !== 'roomOpening') return;
    const timeout = setTimeout(() => {
      if (phase === 'entryOpening') setPhase('hall');
      else setPhase('room');
    }, reduced ? 25 : phase === 'entryOpening' ? 1250 : 860);
    return () => clearTimeout(timeout);
  }, [phase, reduced]);

  useEffect(() => {
    const wheel = event => {
      if (event.ctrlKey || event.metaKey || !event.deltaY) return;
      event.preventDefault();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 360 : 1);
      if (phase === 'entry' && pixels > 0) enter('entry');
      if (phase === 'hall') move(clamp(pixels * .036, -4.2, 4.2));
    };
    const keydown = event => {
      if (event.altKey || event.metaKey || event.ctrlKey || event.target.closest?.('button, a')) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) event.preventDefault();
      if (phase === 'entry' && ['ArrowDown', 'Enter', ' '].includes(event.key)) enter('entry');
      if (phase === 'hall') {
        if (event.key === 'ArrowDown') move(2);
        if (event.key === 'ArrowUp') move(-2);
        if (event.key === 'Enter') enter(nearby?.key);
      }
    };
    const node = view.current;
    if (!node) return;
    node.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', keydown);
    return () => {
      node.removeEventListener('wheel', wheel);
      window.removeEventListener('keydown', keydown);
    };
  }, [phase, nearby]);

  function pointerDown(event) {
    if (event.button !== 0) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  }
  function pointerMove(event) {
    const point = gesture.current;
    if (!point || event.pointerId !== point.id) return;
    const x = event.clientX - point.x;
    const y = event.clientY - point.y;
    if (!point.moved && Math.abs(x) + Math.abs(y) < 6) return;
    point.moved = true;
    if (phase === 'hall') move(-y * .052);
    if (area !== 'entry') Object.assign(point, { x: event.clientX, y: event.clientY });
  }
  function pointerEnd(event) {
    const point = gesture.current;
    if (!point || point.id !== event.pointerId) return;
    gesture.current = null;
    if (!point.moved) return;
    if (phase === 'entry' && point.y - event.clientY > 30) enter('entry');
    draggedAt.current = performance.now();
  }

  function returnToHall() {
    const stop = selected.z + 5.4;
    travel.current = { position: stop, target: stop };
    setNearby(selected);
    setPhase('hall');
  }

  useEffect(() => {
    if (!nearby) return;
    const layers = nearby.chapter.artFiles?.mirror ? ['scene', 'mirror', 'encounter', 'jumpscare'] : ['scene', 'encounter'];
    for (const kind of layers) {
      const image = new Image();
      image.src = art(nearby.chapter, kind);
    }
  }, [nearby]);

  useEffect(() => {
    if (phase === 'hall') view.current?.focus({ preventScroll: true });
  }, [phase]);

  const fallback = <div className="webgl-note">NIGHTMARE</div>;
  const instructions = phase === 'roomOpening' ? '正在进入梦境'
    : phase === 'hall' ? '滚动 / 滑动前行 · 走近后点门'
    : '滚动、上滑或点击门进入';

  return <main className={`experience ${area} ${phase}`} style={{ '--accent': chapter?.color ?? '#ffc887' }}>
    {room ? <DreamRoom door={selected} reduced={reduced} onReturn={returnToHall} /> : <>
      <div className="world" ref={view} tabIndex={0} aria-label={instructions}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onPointerLeave={pointerEnd}>
        <SceneBoundary fallback={fallback}>
          <Canvas fallback={fallback} dpr={[1, 1.5]}
            camera={{ position: [0, 1.59, area === 'entry' ? ENTRY_Z : travel.current.position], fov: 54, near: .06, far: 52 }}>
            <Hall {...{ phase, travel, nearby, selected, reduced, intro }} onNear={setNearby} onDoor={enter} />
          </Canvas>
        </SceneBoundary>
      </div>
      <div className="vignette" />
      <section className="floating-intro" ref={intro} aria-label="游戏介绍">
        <div className="intro-glass">
          <p className="label">关于游戏 / GAME OVERVIEW</p>
          <h2>NIGHTMARE</h2>
          <p className="game-genre">俯视角射击 · 遗物构筑</p>
          <p className="game-description">从童年的床底，一路闯到记忆深处。每层打退两波守卫，从两件随机遗物里选一件，再挑战这一层的梦魇。倒下就失去本局遗物，回到第一扇门。</p>
        </div>
      </section>
      {(phase === 'entry' || chapter) && <section className="scene-caption" aria-live="polite">
        {area === 'entry' ? <>
          <p className="label">THE UNDERCRYPT / 梦魇地牢</p>
          <h1>NIGHTMARE</h1>
          <p className="subtitle">像素动作肉鸽。带着三颗心，闯过四个年纪的噩梦。</p>
        </> : <>
          <p className="label">{chapter.age} / {chapter.english}</p>
          <h1>{chapter.title}</h1>
          <p className="subtitle">{chapter.line}</p>
        </>}
      </section>}
    </>}
    <header className="site-header">
      <div className="wordmark"><Eye /><span>NIGHTMARE</span></div>
      {!room && <a className="play-link" href="https://jzzz456.github.io/nightmare-1/">进入游戏 →</a>}
    </header>
    {!room && <footer className="experience-footer">
      <span><b aria-hidden="true">↓</b> {instructions}</span>
      <span className="position-label">{area === 'entry' ? '入口' : '地下墓廊'}</span>
    </footer>}
    {phase === 'roomOpening' && <div className="door-fade" />}
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
