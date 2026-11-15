"use client";

interface ConfettiProps {
  count?: number;
}

export function Confetti({ count = 20 }: ConfettiProps) {
  const colors = ["#E8F2FA", "#F7E8EE", "#E5F2EB", "#F8EEE2", "#EEEAF7", "#E5F1F8"];
  const shapes = ["●", "■", "▲", "★"];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 0.8 + Math.random() * 0.4;
        const size = 20 + Math.random() * 20;

        return (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${left}%`,
              top: "50%",
              color,
              fontSize: `${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          >
            {shape}
          </div>
        );
      })}
    </div>
  );
}
