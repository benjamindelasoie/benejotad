import { useEffect, useRef, useState } from 'react';
import createGlobe from 'cobe';

export interface GlobeMarker {
  location: [number, number];
  size?: number;
}

interface Props {
  markers: GlobeMarker[];
}

// Monochrome palettes tuned to DESIGN.md: no accent, no glow. The globe reads
// as a flat data object (dotted continents + ink markers), not a glowing toy —
// glowColor is pinned to the page background so the atmospheric halo vanishes.
function palette(dark: boolean) {
  return dark
    ? {
        dark: 1,
        baseColor: [0.22, 0.22, 0.22] as [number, number, number],
        markerColor: [0.98, 0.98, 0.98] as [number, number, number],
        glowColor: [0.04, 0.04, 0.04] as [number, number, number], // ~ --bg #0a0a0a
        mapBrightness: 5,
        // Lift the unlit hemisphere so continents read all the way around (map,
        // not shaded ball) and the 3D gradient stays restrained.
        mapBaseBrightness: 0.18,
      }
    : {
        dark: 0,
        baseColor: [0.74, 0.74, 0.74] as [number, number, number],
        markerColor: [0.04, 0.04, 0.04] as [number, number, number],
        glowColor: [0.98, 0.98, 0.98] as [number, number, number], // ~ --bg #fafafa
        mapBrightness: 1.4,
        mapBaseBrightness: 0.12,
      };
}

export default function Globe({ markers }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const phiRef = useRef(0);
  const [dark, setDark] = useState(false);

  // Track the OS theme so the globe matches the page's hard light/dark invert.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // cobe v2 reparents its own canvas (wraps it in a <div>), which fights
    // React's reconciler on unmount. So React owns only this container, and we
    // create/destroy the canvas imperatively inside it.
    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'width:100%;height:100%;display:block;cursor:grab;contain:layout paint size;';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Rotating globe marking the countries Benja has visited');
    wrap.appendChild(canvas);

    const size = wrap.clientWidth || 460;
    const p = palette(dark);

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size,
      height: size,
      phi: phiRef.current,
      theta: 0.28,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: p.mapBrightness,
      mapBaseBrightness: p.mapBaseBrightness,
      baseColor: p.baseColor,
      markerColor: p.markerColor,
      glowColor: p.glowColor,
      dark: p.dark,
      markers: markers.map((m) => ({ location: m.location, size: m.size ?? 0.04 })),
    });
    globeRef.current = globe;

    // cobe v2 has no internal render loop — we drive rotation ourselves.
    let drag: { x: number; base: number } | null = null;
    let last = NaN;
    let raf = 0;
    const tick = () => {
      if (!drag && !reduce) phiRef.current += 0.003;
      // Skip redundant repaints when static (reduced-motion, no drag).
      if (phiRef.current !== last) {
        globe.update({ phi: phiRef.current });
        last = phiRef.current;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Keep the render buffer matched to the container's CSS size.
    const ro = new ResizeObserver(() => {
      const s = wrap.clientWidth;
      if (s) globe.update({ width: s, height: s });
    });
    ro.observe(wrap);

    // Drag to spin; auto-rotation resumes from wherever you let go.
    const onDown = (e: PointerEvent) => {
      drag = { x: e.clientX, base: phiRef.current };
      canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (drag) phiRef.current = drag.base + (e.clientX - drag.x) / 220;
    };
    const onUp = () => {
      drag = null;
      canvas.style.cursor = 'grab';
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      globe.destroy();
      globeRef.current = null;
      wrap.replaceChildren();
    };
    // markers is a stable build-time prop; rebuild only if it changes identity.
  }, [markers]);

  // Repaint colors on theme flip without tearing the globe down.
  useEffect(() => {
    const p = palette(dark);
    globeRef.current?.update({
      dark: p.dark,
      baseColor: p.baseColor,
      markerColor: p.markerColor,
      glowColor: p.glowColor,
      mapBrightness: p.mapBrightness,
      mapBaseBrightness: p.mapBaseBrightness,
    });
  }, [dark]);

  return <div ref={wrapRef} style={{ width: '100%', height: '100%' }} />;
}
