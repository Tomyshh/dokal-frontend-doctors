'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Link } from '@/i18n/routing';
import { ArrowRight, ChevronDown } from 'lucide-react';
interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
  layer: number;
}

function parseRgbTriplet(cssValue: string): [number, number, number] {
  const parts = cssValue.trim().split(/\s+/).map((v) => parseInt(v, 10));
  return [
    Number.isFinite(parts[0]) ? parts[0] : 11,
    Number.isFinite(parts[1]) ? parts[1] : 143,
    Number.isFinite(parts[2]) ? parts[2] : 120,
  ];
}

function createBeam(w: number, h: number, layer: number): Beam {
  const angle = -35 + Math.random() * 10;
  const baseSpeed = 0.35 + layer * 0.15;
  const baseOpacity = 0.07 + layer * 0.04;
  const baseWidth = 8 + layer * 4;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    width: baseWidth,
    length: h * 2.2,
    angle,
    speed: baseSpeed + Math.random() * 0.15,
    opacity: baseOpacity + Math.random() * 0.08,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.012 + Math.random() * 0.014,
    layer,
  };
}

export interface WelcomeHeroProps {
  badge: React.ReactNode;
  headline: string;
  subtitle: string;
  cta: string;
  learnMore: string;
  /** Mots ou courtes expressions qui défilent (ex. titres des fonctionnalités) */
  rotatingHighlights: string[];
  stats: { value: string; label: string }[];
  screenshotSrc: string;
  screenshotAlt: string;
  openImageAriaLabel: string;
  onScreenshotClick: () => void;
}

const LAYERS = 3;
const BEAMS_PER_LAYER = 7;

export function WelcomeHero({
  badge,
  headline,
  subtitle,
  cta,
  learnMore,
  rotatingHighlights,
  stats,
  screenshotSrc,
  screenshotAlt,
  openImageAriaLabel,
  onScreenshotClick,
}: WelcomeHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noiseRef = useRef<HTMLCanvasElement>(null);
  const beamsRef = useRef<Beam[]>([]);
  const animationFrameRef = useRef<number>(0);
  const dimensionsRef = useRef({ w: 0, h: 0 });
  const colorsRef = useRef({
    bgTop: [2, 39, 33] as [number, number, number],
    bgBottom: [11, 143, 120] as [number, number, number],
    beamCore: [157, 228, 202] as [number, number, number],
    beamEdge: [74, 205, 160] as [number, number, number],
  });
  const [rotateIndex, setRotateIndex] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    const readColors = () => {
      const cs = getComputedStyle(root);
      colorsRef.current = {
        bgTop: parseRgbTriplet(cs.getPropertyValue('--color-primary-950')),
        bgBottom: parseRgbTriplet(cs.getPropertyValue('--color-primary-700')),
        beamCore: parseRgbTriplet(cs.getPropertyValue('--color-primary-200')),
        beamEdge: parseRgbTriplet(cs.getPropertyValue('--color-primary-400')),
      };
    };
    readColors();
    const obs = new MutationObserver(readColors);
    obs.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme-palette'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const noiseCanvas = noiseRef.current;
    if (!container || !canvas || !noiseCanvas) return;

    const ctx = canvas.getContext('2d');
    const nCtx = noiseCanvas.getContext('2d');
    if (!ctx || !nCtx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resizeCanvas = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      dimensionsRef.current = { w, h };
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      noiseCanvas.width = Math.max(1, w * dpr);
      noiseCanvas.height = Math.max(1, h * dpr);
      noiseCanvas.style.width = `${w}px`;
      noiseCanvas.style.height = `${h}px`;
      nCtx.setTransform(1, 0, 0, 1, 0, 0);
      nCtx.scale(dpr, dpr);

      beamsRef.current = [];
      for (let layer = 1; layer <= LAYERS; layer++) {
        for (let i = 0; i < BEAMS_PER_LAYER; i++) {
          beamsRef.current.push(createBeam(w, h, layer));
        }
      }
    };

    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(container);

    const drawBeam = (beam: Beam) => {
      const [cr, cg, cb] = colorsRef.current.beamCore;
      const [er, eg, eb] = colorsRef.current.beamEdge;
      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);

      const pulsingOpacity = Math.min(1, beam.opacity * (0.85 + Math.sin(beam.pulse) * 0.35));
      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);
      gradient.addColorStop(0, `rgba(${er},${eg},${eb},0)`);
      gradient.addColorStop(0.15, `rgba(${cr},${cg},${cb},${pulsingOpacity * 0.45})`);
      gradient.addColorStop(0.5, `rgba(${er},${eg},${eb},${pulsingOpacity})`);
      gradient.addColorStop(0.85, `rgba(${cr},${cg},${cb},${pulsingOpacity * 0.45})`);
      gradient.addColorStop(1, `rgba(${er},${eg},${eb},0)`);

      ctx.fillStyle = gradient;
      ctx.filter = `blur(${2 + beam.layer * 2}px)`;
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx.restore();
    };

    const generateNoise = () => {
      const imgData = nCtx.createImageData(noiseCanvas.width, noiseCanvas.height);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = Math.random() * 255;
        imgData.data[i] = v;
        imgData.data[i + 1] = v;
        imgData.data[i + 2] = v;
        imgData.data[i + 3] = 10;
      }
      nCtx.putImageData(imgData, 0, 0);
    };

    const drawFrame = () => {
      const { w, h } = dimensionsRef.current;
      if (w < 1 || h < 1) return;

      const [tr, tg, tb] = colorsRef.current.bgTop;
      const [br, bg, bb] = colorsRef.current.bgBottom;
      const g = ctx.createLinearGradient(0, 0, w, h * 1.1);
      g.addColorStop(0, `rgb(${tr},${tg},${tb})`);
      g.addColorStop(0.45, `rgb(${br},${bg},${bb})`);
      g.addColorStop(1, `rgb(${tr},${tg},${tb})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      if (!reducedMotion) {
        beamsRef.current.forEach((beam) => {
          beam.y -= beam.speed * (beam.layer / LAYERS + 0.5);
          beam.pulse += beam.pulseSpeed;
          if (beam.y + beam.length < -50) {
            beam.y = h + 50;
            beam.x = Math.random() * w;
          }
          drawBeam(beam);
        });
      }

      if (!reducedMotion) {
        generateNoise();
      }
    };

    const animate = () => {
      drawFrame();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (reducedMotion) {
      drawFrame();
    } else {
      animate();
    }

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (rotatingHighlights.length < 2) return;
    const id = window.setInterval(() => {
      setRotateIndex((p) => (p + 1) % rotatingHighlights.length);
    }, 2600);
    return () => clearInterval(id);
  }, [rotatingHighlights.length]);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden min-h-[100svh] flex items-stretch bg-primary-900"
      aria-label={headline}
    >
      <canvas
        ref={noiseRef}
        className="absolute inset-0 z-[1] pointer-events-none mix-blend-overlay opacity-70"
        aria-hidden
      />
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" aria-hidden />
      <div
        className="absolute inset-0 z-[2] pointer-events-none bg-gradient-to-br from-white/[0.06] via-transparent to-primary-950/50"
        aria-hidden
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full flex items-center pt-28 pb-20 lg:pt-32 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center w-full">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm text-primary-100 mb-8 backdrop-blur-md border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.45 }}
            >
              {badge}
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight">
              {headline}
            </h1>

            {rotatingHighlights.length >= 2 && (
              <div className="relative mt-3 h-9 sm:h-10 overflow-hidden">
                <span className="text-lg sm:text-xl font-semibold text-primary-100/95">
                  {rotatingHighlights.map((label, index) => (
                    <motion.span
                      key={label}
                      className="absolute start-0 top-0 block max-w-full truncate"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                      animate={
                        rotateIndex === index
                          ? { y: 0, opacity: 1 }
                          : {
                              y: rotateIndex > index ? -36 : 36,
                              opacity: 0,
                            }
                      }
                    >
                      {label}
                    </motion.span>
                  ))}
                </span>
              </div>
            )}

            <p className="mt-6 text-lg text-primary-100/90 leading-relaxed max-w-lg">
              {subtitle}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-primary font-semibold text-sm hover:bg-primary-50 transition-all duration-300 shadow-lg shadow-primary-950/40"
              >
                {cta}
                <ArrowRight className="w-4 h-4 rtl-flip-arrow" />
              </Link>
              <button
                type="button"
                onClick={scrollToFeatures}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/25 text-white font-semibold text-sm hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
              >
                {learnMore}
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-6 sm:gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
                >
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs sm:text-sm text-primary-200/90 leading-snug">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative lg:ms-8"
            initial={{ opacity: 0, scale: 0.98, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={onScreenshotClick}
              className="relative w-full rounded-2xl overflow-hidden shadow-2xl shadow-primary-950/50 border border-white/15 hover:border-white/25 hover:scale-[1.01] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200/80"
              aria-label={openImageAriaLabel}
            >
              <Image
                src={screenshotSrc}
                alt={screenshotAlt}
                width={1200}
                height={800}
                className="w-full h-auto"
                priority
              />
            </button>
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary-300/25 blur-3xl" />
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary-400/10 blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
