import { useEffect, useRef } from 'react';

/**
 * Abstract SWOT quadrant visualization.
 * Monochromatic grid with subtle pulsing data points.
 */
export default function SwotVisualization() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const W = 320;
        const H = 200;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);

        let animId = 0;

        // Data points per quadrant
        const points = Array.from({ length: 24 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: 1.5 + Math.random() * 3,
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.7,
            opacity: 0.15 + Math.random() * 0.35,
        }));

        function draw(time: number) {
            const t = time * 0.001;
            ctx!.clearRect(0, 0, W, H);

            // Quadrant lines
            ctx!.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(W / 2, 0);
            ctx!.lineTo(W / 2, H);
            ctx!.moveTo(0, H / 2);
            ctx!.lineTo(W, H / 2);
            ctx!.stroke();

            // Subtle grid
            ctx!.strokeStyle = 'rgba(255,255,255,0.02)';
            ctx!.lineWidth = 0.5;
            for (let i = 1; i < 8; i++) {
                ctx!.beginPath();
                ctx!.moveTo((W / 8) * i, 0);
                ctx!.lineTo((W / 8) * i, H);
                ctx!.stroke();
            }
            for (let i = 1; i < 5; i++) {
                ctx!.beginPath();
                ctx!.moveTo(0, (H / 5) * i);
                ctx!.lineTo(W, (H / 5) * i);
                ctx!.stroke();
            }

            // Quadrant labels
            ctx!.font = '8px Inter, sans-serif';
            ctx!.fillStyle = 'rgba(255,255,255,0.12)';
            ctx!.textAlign = 'center';
            ctx!.fillText('STRENGTHS', W * 0.25, 16);
            ctx!.fillText('WEAKNESSES', W * 0.75, 16);
            ctx!.fillText('OPPORTUNITIES', W * 0.25, H - 8);
            ctx!.fillText('THREATS', W * 0.75, H - 8);

            // Data points
            for (const p of points) {
                const pulse = Math.sin(t * p.speed + p.phase) * 0.5 + 0.5;
                const alpha = p.opacity * (0.5 + pulse * 0.5);
                const r = p.r * (0.8 + pulse * 0.4);

                // Glow
                const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
                grad.addColorStop(0, `rgba(180,195,210,${alpha * 0.3})`);
                grad.addColorStop(1, 'rgba(180,195,210,0)');
                ctx!.fillStyle = grad;
                ctx!.beginPath();
                ctx!.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
                ctx!.fill();

                // Core dot
                ctx!.fillStyle = `rgba(200,210,220,${alpha})`;
                ctx!.beginPath();
                ctx!.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx!.fill();
            }

            // Connecting lines between close points
            ctx!.lineWidth = 0.5;
            for (let i = 0; i < points.length; i++) {
                for (let j = i + 1; j < points.length; j++) {
                    const dx = points[i].x - points[j].x;
                    const dy = points[i].y - points[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 60) {
                        const alpha = (1 - dist / 60) * 0.08;
                        ctx!.strokeStyle = `rgba(200,210,220,${alpha})`;
                        ctx!.beginPath();
                        ctx!.moveTo(points[i].x, points[i].y);
                        ctx!.lineTo(points[j].x, points[j].y);
                        ctx!.stroke();
                    }
                }
            }

            animId = requestAnimationFrame(draw);
        }

        animId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animId);
    }, []);

    return <canvas ref={canvasRef} className="w-full h-auto" />;
}
