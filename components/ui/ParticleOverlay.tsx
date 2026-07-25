// components/ui/ParticleOverlay.tsx
"use client";

import { useEffect, useRef } from "react";
import { OverlayEffect } from "../../lib/types";

export default function ParticleOverlay({ effect }: { effect: OverlayEffect }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (effect === "none") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const rand = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const countMap: Record<OverlayEffect, number> = {
      none: 0,
      rain: 160,
      snow: 90,
      sakura: 40,
      fire: 70,
    };
    const count = countMap[effect];

    const initParticle = (): any => {
      switch (effect) {
        case "rain":
          return {
            x: rand(0, canvas.width),
            y: rand(-canvas.height, canvas.height),
            length: rand(10, 24),
            speed: rand(9, 17),
            opacity: rand(0.15, 0.45),
          };
        case "snow":
          return {
            x: rand(0, canvas.width),
            y: rand(0, canvas.height),
            radius: rand(1.5, 4),
            speed: rand(0.6, 1.8),
            drift: rand(-0.5, 0.5),
            angle: rand(0, Math.PI * 2),
            opacity: rand(0.4, 0.9),
          };
        case "sakura":
          return {
            x: rand(0, canvas.width),
            y: rand(-canvas.height, canvas.height),
            size: rand(6, 12),
            speed: rand(0.8, 2),
            drift: rand(-0.6, 0.6),
            angle: rand(0, Math.PI * 2),
            spin: rand(-0.02, 0.02),
            opacity: rand(0.55, 1),
          };
        case "fire":
          return {
            x: rand(0, canvas.width),
            y: canvas.height + rand(0, 100),
            size: rand(2, 5),
            speed: rand(1, 3),
            drift: rand(-0.4, 0.4),
            life: rand(60, 140),
            age: rand(0, 60),
          };
        default:
          return {};
      }
    };

    const particles: any[] = Array.from({ length: count }, initParticle);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (effect === "rain") {
        ctx.strokeStyle = "rgba(174,194,224,0.7)";
        ctx.lineWidth = 1;
        particles.forEach((p) => {
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.length);
          ctx.stroke();
          p.y += p.speed;
          if (p.y > canvas.height) {
            p.y = rand(-50, 0);
            p.x = rand(0, canvas.width);
          }
        });
      } else if (effect === "snow") {
        ctx.fillStyle = "#ffffff";
        particles.forEach((p) => {
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.speed;
          p.x += Math.sin(p.angle) * 0.5 + p.drift * 0.2;
          p.angle += 0.01;
          if (p.y > canvas.height) {
            p.y = rand(-20, 0);
            p.x = rand(0, canvas.width);
          }
        });
      } else if (effect === "sakura") {
        particles.forEach((p) => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = "#f9a8d4";
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          p.y += p.speed;
          p.x += Math.sin(p.y * 0.02) * 0.6 + p.drift * 0.3;
          p.angle += p.spin;
          if (p.y > canvas.height) {
            p.y = rand(-50, -10);
            p.x = rand(0, canvas.width);
          }
        });
      } else if (effect === "fire") {
        particles.forEach((p) => {
          p.age++;
          const lifeRatio = Math.max(1 - p.age / p.life, 0);
          ctx.globalAlpha = lifeRatio;
          const hue = 20 + Math.random() * 30;
          ctx.fillStyle = `hsl(${hue}, 100%, 55%)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(p.size * lifeRatio, 0.5), 0, Math.PI * 2);
          ctx.fill();
          p.y -= p.speed;
          p.x += p.drift;
          if (p.age >= p.life || p.y < 0) {
            p.x = rand(0, canvas.width);
            p.y = canvas.height + rand(0, 40);
            p.age = 0;
            p.life = rand(60, 140);
          }
        });
      }
      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [effect]);

  if (effect === "none") return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[1] pointer-events-none"
    />
  );
}
