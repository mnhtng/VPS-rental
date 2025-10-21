"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface AnimatedGradientBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  intensity?: "subtle" | "medium" | "strong";
}

interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  hue: number;
  pulse: number;
  pulseSpeed: number;
}

function createBeam(width: number, height: number, theme?: string): Beam {
  const angle = -35 + Math.random() * 10;

  // Thay đổi màu sắc theo theme
  let hueRange, hueBase;
  if (theme === 'dark') {
    hueBase = 200; // Blue tones cho dark theme
    hueRange = 60;
  } else {
    hueBase = 220; // Light blue/purple tones cho light theme  
    hueRange = 40;
  }

  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 30 + Math.random() * 60,
    length: height * 2.5,
    angle: angle,
    speed: 0.6 + Math.random() * 1.2,
    opacity: theme === 'dark' ? 0.12 + Math.random() * 0.16 : 0.08 + Math.random() * 0.12,
    hue: hueBase + Math.random() * hueRange,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.03,
  };
}

export function BeamsBackground({
  className,
  intensity = "medium",
  children,
}: AnimatedGradientBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beamsRef = useRef<Beam[]>([]);
  const animationFrameRef = useRef<number>(0);
  const MINIMUM_BEAMS = 20;

  useEffect(() => {
    const currentTheme = resolvedTheme || 'dark';
    const opacityMap = {
      subtle: currentTheme === 'dark' ? 0.7 : 0.5,
      medium: currentTheme === 'dark' ? 0.85 : 0.6,
      strong: currentTheme === 'dark' ? 1 : 0.7,
    };

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);

      const totalBeams = MINIMUM_BEAMS * 1.5;
      beamsRef.current = Array.from({ length: totalBeams }, () =>
        createBeam(canvas.width, canvas.height, currentTheme)
      );
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    function resetBeam(beam: Beam, index: number, totalBeams: number) {
      if (!canvas) return beam;

      const column = index % 3;
      const spacing = canvas.width / 3;

      beam.y = canvas.height + 100;
      beam.x =
        column * spacing +
        spacing / 2 +
        (Math.random() - 0.5) * spacing * 0.5;
      beam.width = 100 + Math.random() * 100;
      beam.speed = 0.5 + Math.random() * 0.4;

      // Cập nhật màu sắc theo theme
      if (currentTheme === 'dark') {
        beam.hue = 200 + (index * 60) / totalBeams;
        beam.opacity = 0.2 + Math.random() * 0.1;
      } else {
        beam.hue = 220 + (index * 40) / totalBeams;
        beam.opacity = 0.15 + Math.random() * 0.08;
      }

      return beam;
    }

    function drawBeam(ctx: CanvasRenderingContext2D, beam: Beam) {
      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);

      // Calculate pulsing opacity
      const pulsingOpacity =
        beam.opacity *
        (0.8 + Math.sin(beam.pulse) * 0.2) *
        opacityMap[intensity];

      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);

      // Thay đổi saturation và lightness theo theme
      const saturation = currentTheme === 'dark' ? 85 : 70;
      const lightness = currentTheme === 'dark' ? 65 : 55;

      // Enhanced gradient with multiple color stops
      gradient.addColorStop(0, `hsla(${beam.hue}, ${saturation}%, ${lightness}%, 0)`);
      gradient.addColorStop(
        0.1,
        `hsla(${beam.hue}, ${saturation}%, ${lightness}%, ${pulsingOpacity * 0.5})`
      );
      gradient.addColorStop(
        0.4,
        `hsla(${beam.hue}, ${saturation}%, ${lightness}%, ${pulsingOpacity})`
      );
      gradient.addColorStop(
        0.6,
        `hsla(${beam.hue}, ${saturation}%, ${lightness}%, ${pulsingOpacity})`
      );
      gradient.addColorStop(
        0.9,
        `hsla(${beam.hue}, ${saturation}%, ${lightness}%, ${pulsingOpacity * 0.5})`
      );
      gradient.addColorStop(1, `hsla(${beam.hue}, ${saturation}%, ${lightness}%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx.restore();
    }

    function animate() {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "blur(35px)";

      const totalBeams = beamsRef.current.length;
      beamsRef.current.forEach((beam, index) => {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;

        // Reset beam when it goes off screen
        if (beam.y + beam.length < -100) {
          resetBeam(beam, index, totalBeams);
        }

        drawBeam(ctx, beam);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity, resolvedTheme]);

  const currentTheme = resolvedTheme || 'dark';

  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-hidden",
        currentTheme === 'dark' ? "bg-neutral-950" : "bg-gradient-to-br from-slate-50 to-blue-50",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0"
        style={{ filter: currentTheme === 'dark' ? "blur(15px)" : "blur(12px)" }}
      />

      <motion.div
        className={cn(
          "fixed inset-0",
          currentTheme === 'dark' ? "bg-neutral-950/5" : "bg-white/10"
        )}
        animate={{
          opacity: currentTheme === 'dark' ? [0.05, 0.15, 0.05] : [0.03, 0.08, 0.03],
        }}
        transition={{
          duration: 10,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
        style={{
          backdropFilter: currentTheme === 'dark' ? "blur(50px)" : "blur(30px)",
        }}
      />

      <div className="relative z-10 w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 md:py-15">
        {children}
      </div>
    </div>
  );
}
