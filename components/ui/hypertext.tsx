"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, HTMLMotionProps } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type CharacterSet = string[] | readonly string[];

interface HyperTextProps extends HTMLMotionProps<"div"> {
  children: string;
  duration?: number;
  delay?: number;
  startOnView?: boolean;
  animateOnHover?: boolean;
  characterSet?: CharacterSet;
}

const DEFAULT_CHARACTER_SET = Object.freeze(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
) as readonly string[];

const getRandomInt = (max: number): number => Math.floor(Math.random() * max);

export function HyperText({
  children,
  className,
  duration = 800,
  delay = 0,
  startOnView = false,
  animateOnHover = true,
  characterSet = DEFAULT_CHARACTER_SET,
  ...props
}: HyperTextProps) {
  const [displayText, setDisplayText] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const iterationCount = useRef(0);
  const elementRef = useRef<HTMLDivElement>(null);

  const triggerAnimation = () => {
    iterationCount.current = 0;
    setIsAnimating(true);
  };

  useEffect(() => {
    setDisplayText(children.split(""));
    triggerAnimation();
  }, [children]);

  useEffect(() => {
    if (!startOnView) {
      const startTimeout = setTimeout(() => {
        triggerAnimation();
      }, delay);
      return () => clearTimeout(startTimeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            triggerAnimation();
          }, delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "-30% 0px -30% 0px" }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay, startOnView]);

  useEffect(() => {
    if (!isAnimating) return;

    const maxIterations = children.length;
    const startTime = performance.now();
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      iterationCount.current = progress * maxIterations;

      setDisplayText(() =>
        children
          .split("")
          .map((letter, index) =>
            letter === " "
              ? letter
              : index <= iterationCount.current
              ? children[index]
              : characterSet[getRandomInt(characterSet.length)]
          )
      );

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isAnimating, characterSet, duration, children]);

  const handleMouseEnter = () => {
    if (animateOnHover) {
      triggerAnimation();
    }
  };

  return (
    <motion.div
      ref={elementRef}
      className={cn("overflow-hidden", className)}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      <AnimatePresence initial={false}>
        {displayText.map((letter, index) => (
          <motion.span
            key={index}
            className={cn("font-number", letter === " " ? "w-3" : "")}
          >
            {letter.toUpperCase()}
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
