// @AI-HINT: This is a theme-aware, accessible Slider component built on top of the Radix UI Slider primitive. It's designed for premium, production-ready applications, featuring per-component CSS modules for styling and robust type definitions for props.
'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import commonStyles from './Slider.common.module.css';
import lightStyles from './Slider.light.module.css';
import darkStyles from './Slider.dark.module.css';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(commonStyles.sliderRoot, themeStyles.sliderRoot, className)}
      {...props}
    >
      <SliderPrimitive.Track className={cn(commonStyles.sliderTrack, themeStyles.sliderTrack)}>
        <SliderPrimitive.Range className={cn(commonStyles.sliderRange, themeStyles.sliderRange)} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={cn(commonStyles.sliderThumb, themeStyles.sliderThumb)} />
    </SliderPrimitive.Root>
  );
});

Slider.displayName = SliderPrimitive.Root.displayName;

export default Slider;
