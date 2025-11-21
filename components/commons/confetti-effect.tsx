"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

const ConfettiEffect = forwardRef<{ start: () => void; stop: () => void }, object>(
  (_, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationIdRef = useRef<number | null>(null);

    const CONFETTI_COLORS = ["#bf953f", "#fbf5b3", "#e6c475", "#ffffff"];

    const createParticle = (): Particle => {
      const canvas = canvasRef.current;
      if (!canvas) return {} as Particle;

      return {
        x: Math.random() * canvas.width,
        y: -20,
        size: Math.random() * 6 + 4,
        speedY: Math.random() * 2 + 1,
        speedX: Math.random() * 2 - 1,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2,
        update() {
          this.y += this.speedY;
          if (canvas) {
            this.x += Math.sin(this.y * 0.01) + this.speedX;
          }
          this.rotation += this.rotationSpeed;
        },
        draw(ctx: CanvasRenderingContext2D) {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate((this.rotation * Math.PI) / 180);
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.moveTo(0, -this.size);
          ctx.lineTo(this.size / 2, 0);
          ctx.lineTo(0, this.size);
          ctx.lineTo(-this.size / 2, 0);
          ctx.fill();
          ctx.restore();
        },
      };
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      return () => window.removeEventListener("resize", resizeCanvas);
    }, []);

    useImperativeHandle(ref, () => ({
      start: () => {
        if (animationIdRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        particlesRef.current = [];
        for (let i = 0; i < 150; i++) {
          particlesRef.current.push(createParticle());
        }

        const animate = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (particlesRef.current.length < 400 && Math.random() < 0.05) {
            particlesRef.current.push(createParticle());
          }

          for (let i = 0; i < particlesRef.current.length; i++) {
            const particle = particlesRef.current[i];
            particle.update();
            particle.draw(ctx);

            if (particle.y > canvas.height) {
              particle.y = -20;
              particle.x = Math.random() * canvas.width;
            }
          }

          animationIdRef.current = requestAnimationFrame(animate);
        };

        animate();
      },
      stop: () => {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;

          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }
        }
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
      />
    );
  }
);

ConfettiEffect.displayName = "ConfettiEffect";

export default ConfettiEffect;
