import { useEffect, useRef, useState } from 'react';
import { art } from './chapters.js';
import SandReveal from './SandReveal.jsx';
import QuiltBed from './QuiltBed.jsx';
import { HangingEyes, MemoryHall } from './DreamEffects.jsx';

const ROOMS = [
  { description: '熄灯以后，床下多出了一只手。躲开地上的掌印，趁巨人收手时开火。手心一翻，下一批眼球兵就要落地。', light: '#ef5db9', y: '56%' },
  { description: '镜影会重走你的脚步。把亮镜留在你和倒影之间，等它锁定冲刺再侧身闪开。玻璃碎裂，就是你开火的机会。', after: '它已经到了镜子这边。半血后，一面镜子困不住它。引它再撞碎一面。', light: '#b4c375', y: '53%' },
  { description: '你错过的黄昏，长成了蛾翼上的金环。击碎两座沙漏，穿过弹幕拾起两枚砂核。它展翅的几秒，才是你的机会。', light: '#ff914b', y: '46%' },
  { description: '四扇门，只有灯还记得回家的路。记住门号，熄灯后按顺序走近，朝守门人胸口敞开的金门射击。半血之后，倒着走。', light: '#d2a4ee', y: '40%' },
];
const limit = (value, min, max) => Math.max(min, Math.min(value, max));
const cameraStart = () => ({ x: 0, y: 0, depth: .06 });

export default function DreamRoom({ door, reduced, onReturn }) {
  const { chapter, index } = door;
  const detail = ROOMS[index];
  const [beat, setBeat] = useState('watch');
  const [sandPhase, setSandPhase] = useState('flowing');
  const world = useRef(null);
  const stage = useRef(null);
  const target = useRef(cameraStart());
  const pointer = useRef(null);
  const mirror = index === 1;
  const childhood = index === 0;
  const adulthood = index === 2;
  const oldAge = index === 3;
  const scene = art(chapter, 'scene');
  const encounter = art(chapter, 'encounter');
  const behindGlass = mirror && (beat === 'watch' || beat === 'breath');

  useEffect(() => {
    const surface = stage.current;
    const viewport = world.current;
    viewport.focus({ preventScroll: true });
    let frame;
    const current = cameraStart();
    const paint = () => {
      const next = target.current;
      if (Math.abs(next.x - current.x) > .04 || Math.abs(next.y - current.y) > .04 || Math.abs(next.depth - current.depth) > .0006) {
        for (const key of ['x', 'y', 'depth']) current[key] += (next[key] - current[key]) * (reduced ? 1 : .09);
        surface.style.setProperty('--look-x', `${current.x.toFixed(2)}px`);
        surface.style.setProperty('--look-y', `${current.y.toFixed(2)}px`);
        surface.style.setProperty('--approach', current.depth.toFixed(4));
      }
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    const wheel = event => {
      if (event.ctrlKey || event.metaKey || !event.deltaY) return;
      event.preventDefault();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 340 : 1);
      target.current.depth = limit(target.current.depth + pixels * .0015, 0, 1);
    };
    viewport.addEventListener('wheel', wheel, { passive: false });
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('wheel', wheel);
    };
  }, [reduced]);

  useEffect(() => {
    if (beat !== 'breath' && beat !== 'lunge') return;
    const timer = setTimeout(() => {
      if (beat === 'breath') {
        target.current.x = 0;
        target.current.y = 0;
        setBeat(reduced ? 'seen' : 'lunge');
      } else setBeat('seen');
    }, beat === 'breath' ? 540 : 780);
    return () => clearTimeout(timer);
  }, [beat, reduced]);

  function approach() {
    target.current.depth = .85;
    setBeat(reduced ? 'seen' : 'breath');
    world.current.focus({ preventScroll: true });
  }

  function look(event) {
    if (beat === 'lunge') return;
    if (event.pointerType === 'mouse') {
      const bounds = stage.current.getBoundingClientRect();
      target.current.x = (event.clientX / bounds.width - .5) * 58;
      target.current.y = (event.clientY / bounds.height - .5) * 38;
    } else if (pointer.current?.id === event.pointerId) {
      const dx = event.clientX - pointer.current.x;
      const dy = event.clientY - pointer.current.y;
      target.current.x = limit(target.current.x - dx * .34, -32, 32);
      target.current.depth = limit(target.current.depth - dy * .003, 0, 1);
      pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }
  }

  function startLook(event) {
    if (event.pointerType === 'mouse') return;
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') { onReturn(); return; }
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      target.current.depth = limit(target.current.depth + (event.key === 'ArrowUp' ? .13 : -.13), 0, 1);
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      target.current.x = limit(target.current.x + (event.key === 'ArrowLeft' ? -8 : 8), -32, 32);
    }
    if (event.key === 'Enter' && mirror && beat === 'watch') approach();
  }

  return <section className={`dream-room dream-${index + 1} dream-${beat}${index === 2 ? ` adult-${sandPhase}` : ''}`} aria-label={chapter.title} style={{ '--dream-light': detail.light, '--boss-y': detail.y }}>
    <div className="dream-view" ref={world} tabIndex={0} onKeyDown={onKeyDown}
      aria-label={`${chapter.boss}。方向键移动视角。${mirror ? '回车靠近镜子。' : ''} Escape 返回走廊。`}>
      <div className="dream-stage" ref={stage} onPointerMove={look} onPointerDown={startLook}
        onPointerUp={() => { pointer.current = null; }} onPointerCancel={() => { pointer.current = null; }}>
        {oldAge ? <MemoryHall src={scene} reduced={reduced} /> : <img className="dream-distance" src={scene} alt="" draggable="false" />}
        <div className="dream-haze" aria-hidden="true" />
        <div className="boss-shadow" aria-hidden="true" />
        {mirror && <div className="dream-mirror" aria-hidden="true">
          <img className="mirror-prop" src={art(chapter, 'mirror')} alt="" draggable="false" />
          {behindGlass && <div className="mirror-glass">
            <img className="mirror-reflection" src={encounter} alt="" draggable="false" />
          </div>}
        </div>}
        <div className="boss-projection" aria-hidden={behindGlass || undefined}>
          <img className="dream-boss" src={encounter} alt={chapter.boss} draggable="false" />
        </div>
        {!oldAge && <div className="dream-foreground" aria-hidden="true" style={{ backgroundImage: `url(${scene})` }} />}
        {childhood && <HangingEyes src={art(chapter, 'hanging-eye-v2')} />}
        <div className="dream-dust" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 5) % 100}%`, top: `${(i * 23 + 37) % 78}%`, animationDelay: `${i * -.94}s` }} />)}
        </div>
        {childhood && <QuiltBed bedSrc={art(chapter, 'bed-foot-tucked')} awakeSrc={art(chapter, 'bed-foot-raised')} reduced={reduced} />}
        {adulthood && <SandReveal reduced={reduced} phase={sandPhase} onPhase={setSandPhase} />}
        <div className="dream-lens" aria-hidden="true" />
        {mirror && beat === 'lunge' && <div className="mirror-jumpscare" aria-hidden="true">
          <img src={art(chapter, 'jumpscare')} alt="" draggable="false" />
        </div>}
      </div>
    </div>
    <div className="dream-hud">
      <div className="dream-identity">
        <h1>{chapter.boss}</h1>
        <p aria-live="polite">{beat === 'seen' ? detail.after : detail.description}</p>
      </div>
    </div>
    {mirror && beat === 'watch' && <button className="dream-approach mirror-approach" type="button" onClick={approach}>
      靠近镜子 <span aria-hidden="true">→</span>
    </button>}
    <button type="button" className="return-to-hall" onClick={onReturn}>← 离开梦境</button>
  </section>;
}
