'use client';

import type { ReactNode } from 'react';

/**
 * Fond continu sous le hero : dégradé aligné sur la sortie du hero (évite la « couture »),
 * halos et faisceaux légers sur toute la hauteur pour garder du relief.
 */
export function WelcomeLandingSeamlessBg({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate z-0">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        {/* Base : même teinte que le bas du hero sur ~12 % de hauteur (zéro ligne), puis variation douce */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950 from-0% via-primary-950 via-[12%] via-primary-900/98 via-[24%] via-primary-900 via-[40%] via-primary-950 via-[58%] via-primary-800/75 via-[76%] via-primary-900 via-[90%] to-primary-950 to-100%" />

        {/* Faisceaux / reflets diagonaux (mint du thème, très basse opacité) */}
        <div
          className="welcome-landing-beam-layer absolute inset-[-20%_-10%] mix-blend-soft-light opacity-90"
          style={{
            backgroundImage: `
              linear-gradient(118deg, transparent 0%, transparent 36%, rgb(var(--color-primary-200) / 0.09) 48%, transparent 62%),
              linear-gradient(128deg, transparent 0%, transparent 42%, rgb(var(--color-primary-400) / 0.07) 52%, transparent 68%),
              linear-gradient(106deg, transparent 52%, rgb(var(--color-primary-300) / 0.06) 64%, transparent 78%),
              linear-gradient(132deg, transparent 18%, rgb(var(--color-primary-200) / 0.05) 32%, transparent 46%)
            `,
          }}
        />
        <div
          className="absolute inset-0 mix-blend-overlay opacity-[0.35]"
          style={{
            backgroundImage: `
              linear-gradient(125deg, transparent 55%, rgb(255 255 255 / 0.04) 68%, transparent 82%),
              linear-gradient(112deg, transparent 8%, rgb(255 255 255 / 0.025) 22%, transparent 38%)
            `,
          }}
        />

        {/* Halos diffus — renforcés et répartis sur toute la page */}
        {/* Halo haut : évite un saut lumineux exactement sur la couture hero / contenu */}
        <div className="absolute left-1/2 top-[8%] h-[min(78vh,760px)] w-[min(118vw,980px)] -translate-x-1/2 rounded-full bg-primary-400/18 blur-[130px]" />
        <div className="absolute top-[8%] -right-[20%] h-[min(60vw,620px)] w-[min(60vw,620px)] rounded-full bg-primary-300/22 blur-[120px]" />
        <div className="absolute top-[28%] -left-[22%] h-[min(55vw,560px)] w-[min(55vw,560px)] rounded-full bg-primary-500/18 blur-[115px]" />
        <div className="absolute top-[48%] left-[55%] h-[min(50vw,520px)] w-[min(50vw,520px)] -translate-x-1/2 rounded-full bg-primary-200/14 blur-[100px]" />
        <div className="absolute bottom-[22%] right-[6%] h-[min(62vw,600px)] w-[min(62vw,600px)] rounded-full bg-primary-400/20 blur-[128px]" />
        <div className="absolute bottom-[6%] left-[12%] h-[min(48vw,480px)] w-[min(48vw,480px)] rounded-full bg-primary-600/16 blur-[110px]" />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_140%_75%_at_50%_-5%,rgba(255,255,255,0.075),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_45%_at_85%_35%,rgb(var(--color-primary-200)_/_0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_15%_60%,rgb(var(--color-primary-400)_/_0.05),transparent_48%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_80%_100%,rgba(0,0,0,0.14),transparent_46%)]" />
      </div>
      {children}
    </div>
  );
}
