"use client";

import * as React from "react";

type ScoreCircleProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
};

export function ScoreCircle({
  value,
  size = 200,
  strokeWidth = 12,
  label = "TIAM バランス指数",
}: ScoreCircleProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const [animated, setAnimated] = React.useState(0);

  // ドットを描画する円弧の計算
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // ふわっとカウントアップ。同じ値で再マウントされても 0→value で再演出。
  React.useEffect(() => {
    const start = performance.now();
    const duration = 1100;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(clamped * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const dashOffset = circumference * (1 - animated / 100);

  return (
    <div
      className="relative inline-flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`${label}: ${clamped.toFixed(1)}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--tiam-gold)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-tiam-gold font-heading text-[10px] tracking-[0.3em] uppercase">
          {label}
        </span>
        <span className="font-heading text-tiam-primary mt-1 text-4xl tracking-tight tabular-nums sm:text-5xl">
          {animated.toFixed(1)}
        </span>
        <span className="text-muted-foreground mt-0.5 text-xs tracking-wide">
          / 100
        </span>
      </div>
    </div>
  );
}
