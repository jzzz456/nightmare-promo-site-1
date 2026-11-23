import { useEffect, useRef, useState } from 'react';

// [x, fixed quilt crease, lowered hem, raised hem] in the two 1402 × 1122 poses.
// The front rail sits immediately below the lowered hem.
const FOOT = [
  [151, 710, 725, 723], [178, 610, 730, 661], [258, 532, 740, 615],
  [356, 456, 751, 576], [454, 417, 764, 533], [509, 405, 770, 502],
  [562, 397, 777, 518], [608, 384, 783, 544], [665, 398, 790, 578],
  [713, 408, 795, 620], [748, 464, 799, 658], [768, 676, 801, 796],
];

// Isolate the hooked fingers and their connected forearm from the final pose.
const ARM = 'M546 467 Q554 451 573 446 Q590 431 606 447 Q618 448 626 458 '
  + 'Q645 465 654 487 Q662 500 663 519 C670 556 690 596 710 635 '
  + 'Q735 688 713 701 Q685 714 673 685 C660 641 639 600 625 565 '
  + 'Q619 547 618 531 Q608 543 598 528 Q587 530 582 515 '
  + 'Q570 518 565 501 Q549 506 545 491 Q542 480 546 467Z';

function phase(time, start, end) {
  const t = Math.min(1, Math.max(0, (time - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function paint(canvas, tucked, raised, time) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(canvas.width / 1402, 0, 0, canvas.height / 1122, 0, 0);
  ctx.clearRect(0, 0, 1402, 1122);
  ctx.drawImage(tucked, 0, 0, 1402, 1122);
  if (time === 0) return;

  const reach = phase(time, 0, .24);
  const lift = phase(time, .21, .90);
  const sx = tucked.naturalWidth / 1402;
  const sy = tucked.naturalHeight / 1122;
  if (lift > 0) {
    // Reveal the stationary face only within the opening above the mattress.
    ctx.save();
    ctx.beginPath();
    for (const [x, , low, high] of FOOT) ctx.lineTo(x, low + (high - low) * lift);
    for (let i = FOOT.length - 1; i >= 0; i--) ctx.lineTo(FOOT[i][0], FOOT[i][2]);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(raised, 0, 0, 1402, 1122);
    ctx.restore();

    // Each fabric strip shortens toward the grip, keeping its rear crease fixed.
    for (let i = 1; i < FOOT.length; i++) {
      const [left, crease, low, high] = FOOT[i - 1];
      const [right, nextCrease, nextLow, nextHigh] = FOOT[i];
      for (let x = left; x < right; x += 3) {
        const f = (x - left) / (right - left);
        const top = crease + (nextCrease - crease) * f;
        const hem = low + (nextLow - low) * f;
        const pulled = hem + (high + (nextHigh - high) * f - hem) * lift;
        const width = Math.min(3, right - x);
        ctx.drawImage(tucked, x * sx, top * sy, width * sx, (hem - top) * sy,
          x, top, width + .3, pulled - top);
      }
    }
  }

  ctx.save();
  // The footboard occludes the wrist until the hand rises above the front hem.
  ctx.beginPath();
  ctx.moveTo(150, 0);
  ctx.lineTo(770, 0);
  ctx.lineTo(770, 801);
  ctx.lineTo(150, 725);
  ctx.closePath();
  ctx.clip();
  ctx.translate(-18 * (1 - lift), 251 * (1 - lift) + 105 * (1 - reach));
  ctx.clip(new Path2D(ARM));
  ctx.drawImage(raised, 0, 0, 1402, 1122);
  ctx.restore();


}

export default function QuiltBed({ bedSrc, awakeSrc, reduced }) {
  const bed = useRef(null);
  const awake = useRef(null);
  const canvas = useRef(null);
  const lift = useRef(0);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  function checkImages() {
    if (bed.current?.naturalWidth && awake.current?.naturalWidth) setReady(true);
  }

  useEffect(() => {
    if (!ready) return;
    const from = lift.current;
    const to = Number(open);
    const start = performance.now();
    const duration = (open ? 1420 : 650) * Math.abs(to - from);
    let frame;
    function draw(now) {
      const t = reduced || !duration ? 1 : Math.min(1, (now - start) / duration);
      lift.current = from + (to - from) * t;
      paint(canvas.current, bed.current, awake.current, lift.current);
      if (t < 1) frame = requestAnimationFrame(draw);
    }
    draw(start);
    return () => cancelAnimationFrame(frame);
  }, [open, ready, reduced]);

  return <button className="quilt-bed" type="button" aria-label={open ? '盖好被子' : '在床上睡一会'} aria-pressed={open}
    disabled={!ready} onClick={() => setOpen(previous => !previous)}
    onPointerDown={event => event.stopPropagation()}>
    <img ref={bed} src={bedSrc} alt="" draggable="false" onLoad={checkImages} hidden={ready} />
    <img ref={awake} src={awakeSrc} alt="" onLoad={checkImages} hidden />
    <canvas ref={canvas} width="876" height="701" hidden={!ready} aria-hidden="true" />
    <span className="quilt-prompt">{open ? '盖好被子' : '在床上睡一会'} <span aria-hidden="true">→</span></span>
  </button>;
}
