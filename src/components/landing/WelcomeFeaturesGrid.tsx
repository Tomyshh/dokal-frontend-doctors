'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FeatureCard, type GridFeatureItem } from '@/components/ui/grid-feature-cards';
import { ContentHaloWrap } from '@/components/landing/ContentHaloWrap';
import { cn } from '@/lib/utils';

type ViewAnimationProps = {
  delay?: number;
  className?: React.ComponentProps<typeof motion.div>['className'];
  children: React.ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export interface WelcomeFeaturesGridProps {
  sectionId?: string;
  title: string;
  subtitle: string;
  features: GridFeatureItem[];
}

/**
 * Section « Tout ce dont vous avez besoin » — grille avec FeatureCard (design features.txt).
 */
export function WelcomeFeaturesGrid({
  sectionId = 'features',
  title,
  subtitle,
  features,
}: WelcomeFeaturesGridProps) {
  return (
    <section
      id={sectionId}
      className="relative overflow-hidden bg-transparent py-20 md:py-28 lg:py-32"
      aria-labelledby="welcome-features-grid-heading"
    >
      <div className="relative mx-auto w-full max-w-7xl space-y-10 px-6 lg:px-8">
        <AnimatedContainer className="mx-auto max-w-3xl text-center">
          <h2
            id="welcome-features-grid-heading"
            className="text-balance text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl"
          >
            {title}
          </h2>
          <p className="mt-4 text-balance text-sm tracking-wide text-primary-200/90 md:text-base">
            {subtitle}
          </p>
        </AnimatedContainer>

        <AnimatedContainer delay={0.35}>
          <ContentHaloWrap rounded="rounded-2xl">
            <div
              className={cn(
                'relative z-0 grid grid-cols-1 divide-x divide-y divide-dashed divide-white/15 border border-dashed border-white/15 bg-white/[0.04] backdrop-blur-md sm:grid-cols-2',
                features.length >= 6 && 'md:grid-cols-3',
                features.length < 6 && 'lg:grid-cols-2',
                features.length === 4 && 'xl:grid-cols-4'
              )}
            >
              {features.map((feature, i) => (
                <FeatureCard key={`${feature.title}-${i}`} feature={feature} tone="onPrimary" />
              ))}
            </div>
          </ContentHaloWrap>
        </AnimatedContainer>
      </div>
    </section>
  );
}
