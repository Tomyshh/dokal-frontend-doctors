'use client';

import { cn } from '@/lib/utils';
import React from 'react';

export type GridFeatureItem = {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
};

type FeatureCardProps = React.ComponentProps<'div'> & {
  feature: GridFeatureItem;
  /** Texte clair sur dégradé primary (landing) */
  tone?: 'default' | 'onPrimary';
};

/** Motif stable par titre (évite décalage SSR/CSR avec Math.random). */
function patternFromSeed(seed: string, length = 5): number[][] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return Array.from({ length }, (_, i) => {
    h = (h * 1103515245 + 12345 + i) >>> 0;
    const x = 7 + (h % 4);
    h = (h * 1103515245 + 12345) >>> 0;
    const y = 1 + (h % 6);
    return [x, y];
  });
}

export function FeatureCard({ feature, className, tone = 'default', ...props }: FeatureCardProps) {
  const pattern = React.useMemo(() => patternFromSeed(feature.title), [feature.title]);
  const Icon = feature.icon;
  const onPrimary = tone === 'onPrimary';

  return (
    <div className={cn('relative overflow-hidden p-6 md:p-8', className)} {...props}>
      <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100',
            onPrimary ? 'from-white/10 to-white/[0.02]' : 'from-foreground/5 to-foreground/1'
          )}
        >
          <GridPattern
            width={20}
            height={20}
            x="-12"
            y="4"
            squares={pattern}
            className={cn(
              'absolute inset-0 h-full w-full mix-blend-overlay',
              onPrimary ? 'fill-white/10 stroke-white/20' : 'fill-foreground/5 stroke-foreground/25'
            )}
          />
        </div>
      </div>
      <Icon
        className={cn('size-6 md:size-7', onPrimary ? 'text-primary-200' : 'text-primary')}
        strokeWidth={1.25}
        aria-hidden
      />
      <h3
        className={cn(
          'mt-8 text-base font-semibold md:mt-10 md:text-lg',
          onPrimary ? 'text-primary-50' : 'text-foreground'
        )}
      >
        {feature.title}
      </h3>
      <p
        className={cn(
          'relative z-20 mt-2 text-xs font-light leading-relaxed md:text-sm',
          onPrimary ? 'text-primary-200/85' : 'text-muted-foreground'
        )}
      >
        {feature.description}
      </p>
    </div>
  );
}

function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: React.ComponentProps<'svg'> & {
  width: number;
  height: number;
  x: string;
  y: string;
  squares?: number[][];
}) {
  const patternId = React.useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([sx, sy], index) => (
            <rect
              strokeWidth="0"
              key={index}
              width={width + 1}
              height={height + 1}
              x={sx * width}
              y={sy * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
