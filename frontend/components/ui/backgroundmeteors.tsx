"use client";

import React, { ReactNode, useState, useEffect } from "react";

interface BackgroundMeteorsProps {
  children?: ReactNode;
}

export default function BackgroundMeteors({
  children,
}: BackgroundMeteorsProps) {
  const [isMounted, setIsMounted] = useState(false);
  const gridSize = 50;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="relative flex md:min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden bg-white dark:bg-black">
        <div className="py-10 z-10 flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex md:min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden bg-white dark:bg-black" suppressHydrationWarning>
      {/* Light mode grid */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundImage:
            "linear-gradient(to right, #e4e4e7 1px, transparent 1px), linear-gradient(to bottom, #e4e4e7 1px, transparent 1px)",
        }}
        suppressHydrationWarning
      />
      {/* Dark mode grid */}
      <div
        className="absolute inset-0 dark:block hidden"
        style={{
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundImage:
            "linear-gradient(to right, #262626 1px, transparent 1px), linear-gradient(to bottom, #024e6b 1px, transparent 1px)",
        }}
        suppressHydrationWarning
      />
      {/* Fade effect */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" suppressHydrationWarning />

      {/* Content */}
      <div className="py-10 z-10 flex items-center justify-center" suppressHydrationWarning>
        {children}
      </div>
    </div>
  );
}