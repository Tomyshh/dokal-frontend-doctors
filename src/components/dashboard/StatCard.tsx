'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  iconBg?: string;
  iconColor?: string;
  accentColor?: string;
}

function useAnimatedCounter(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (target === prevTarget.current && count === target) return;
    prevTarget.current = target;

    if (target === 0) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return count;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  iconBg = 'bg-primary-50',
  iconColor = 'text-primary',
  accentColor = 'border-l-transparent',
}: StatCardProps) {
  const isNumeric = typeof value === 'number';
  const animatedValue = useAnimatedCounter(isNumeric ? value : 0);

  return (
    <div className={cn('stat-card', accentColor)}>
      <div className="stat-card-row flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium leading-snug break-words whitespace-normal">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground mt-1 tabular-nums">
            {isNumeric ? animatedValue : value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 break-words whitespace-normal">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.positive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.positive ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-3 shrink-0 transition-transform duration-200 group-hover:scale-110', iconBg)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>
    </div>
  );
}
