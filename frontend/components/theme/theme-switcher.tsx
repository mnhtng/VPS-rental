"use client";

import { MonitorIcon, MoonStarIcon, SunIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import type { JSX } from "react";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { flushSync } from "react-dom";

function ThemeOption({
  icon,
  value,
  isActive,
  onClick,
}: {
  icon: JSX.Element;
  value: string;
  isActive?: boolean;
  onClick: (value: string) => void;
}) {
  return (
    <button
      className={cn(
        "relative flex size-8 cursor-default items-center justify-center rounded-full transition-all duration-200 [&_svg]:size-4",
        isActive
          ? "dark:text-teal-300 shadow-sm shadow-zinc-300 dark:shadow-teal-200"
          : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-200"
      )}
      role="radio"
      aria-checked={isActive}
      aria-label={`Switch to ${value} theme`}
      onClick={() => onClick(value)}
    >
      {isActive ? (
        <motion.div
          initial={{ opacity: 0, scale: 0, rotate: 120 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            duration: 0.5,
            scale: { type: "spring", visualDuration: 0.5, bounce: 0.5 },
          }}
        >
          {icon}
        </motion.div>
      ) : (
        icon
      )}

      {isActive && (
        <motion.div
          layoutId="theme-option"
          transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
          className="absolute inset-0 rounded-full border-2 border-zinc-300 dark:border-1 dark:border-teal-600"
        />
      )}
    </button>
  );
}

const THEME_OPTIONS = [
  {
    icon: <MonitorIcon />,
    value: "system",
  },
  {
    icon: <SunIcon />,
    value: "light",
  },
  {
    icon: <MoonStarIcon />,
    value: "dark",
  },
];

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const themeRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="flex h-8 w-24" />;
  }

  // Handle theme change animation
  const handleThemeChange = async (value: string) => {
    if (!themeRef.current) {
      setTheme(value);
      return;
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(value);
      });
    }).ready;

    const { top, left, width, height } = themeRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top),
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 400,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      }
    );
  };

  return (
    <motion.div
      ref={themeRef}
      key={String(isMounted)}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center gap-1 rounded-full shadow-sm"
      role="radiogroup"
    >
      {THEME_OPTIONS.map((option) => (
        <ThemeOption
          key={option.value}
          icon={option.icon}
          value={option.value}
          isActive={theme === option.value}
          onClick={() => handleThemeChange(option.value)}
        />
      ))}
    </motion.div>
  );
}

export { ThemeSwitcher };
