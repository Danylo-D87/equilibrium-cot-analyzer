import { useEffect, useRef } from 'react';

/**
 * Minimalist equity-curve visualization for the Journal tool card.
 * An ascending line with subtle candle markers on a dark background.
 */
export default function JournalVisualization() {
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
        let t = 0;

        // Generate equity curve points with some drawdowns
        const points: number[] = [];
        let value = 0.5;
        for (let i = 0; i < 40; i++) {
            value += (Math.random() - 0.38) * 0.06;
            value = Math.max(0.1, Math.min(0.9, value));
            points.push(value);
        }

        const bronze = [196, 168, 124]; // #c4a87c

        function draw() {
            ctx!.clearRect(0, 0, W, H);

            // Faint grid lines
            ctx!.strokeStyle = `rgba(${bronze[0]}, ${bronze[1]}, ${bronze[2]}, 0.04)`;
            ctx!.lineWidth = 0.5;
            for (let y = 40; y < H; y += 40) {
                ctx!.beginPath();
                ctx!.moveTo(0, y);
                ctx!.lineTo(W, y);
                ctx!.stroke();
            }

            const spacing = W / (points.length - 1);
            const phase = Math.sin(t * 0.3) * 0.015;

            // Gradient fill under curve
            const grad = ctx!.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, `rgba(${bronze[0]}, ${bronze[1]}, ${bronze[2]}, 0.08)`);
            grad.addColorStop(1, `rgba(${bronze[0]}, ${bronze[1]}, ${bronze[2]}, 0.0)`);

            ctx!.beginPath();
            ctx!.moveTo(0, H);
            for (let i = 0; i < points.length; i++) {
                const x = i * spacing;
                const y = H - (points[i] + phase) * H * 0.8 - 20;
                if (i === 0) ctx!.lineTo(x, y);
                else {
                    const prevX = (i - 1) * spacing;
                    const prevY = H - (points[i - 1] + phase) * H * 0.8 - 20;
                    const cpx = (prevX + x) / 2;
                    ctx!.bezierCurveTo(cpx, prevY, cpx, y, x, y);
                }
            }
            ctx!.lineTo(W, H);
            ctx!.closePath();
            ctx!.fillStyle = grad;
            ctx!.fill();

            // Main equity line
            ctx!.beginPath();
            for (let i = 0; i < points.length; i++) {
                const x = i * spacing;
                const y = H - (points[i] + phase) * H * 0.8 - 20;
                if (i === 0) ctx!.moveTo(x, y);
                else {
                    const prevX = (i - 1) * spacing;
                    const prevY = H - (points[i - 1] + phase) * H * 0.8 - 20;
                    const cpx = (prevX + x) / 2;
                    ctx!.bezierCurveTo(cpx, prevY, cpx, y, x, y);
                }
            }
            ctx!.strokeStyle = `rgba(${bronze[0]}, ${bronze[1]}, ${bronze[2]}, 0.5)`;
            ctx!.lineWidth = 1.5;
            ctx!.stroke();

            // Small dots at data points
            for (let i = 0; i < points.length; i += 4) {
                const x = i * spacing;
                const y = H - (points[i] + phase) * H * 0.8 - 20;
                const alpha = 0.15 + Math.sin(t * 0.5 + i * 0.3) * 0.1;
                ctx!.beginPath();
                ctx!.arc(x, y, 2, 0, Math.PI * 2);
                ctx!.fillStyle = `rgba(${bronze[0]}, ${bronze[1]}, ${bronze[2]}, ${alpha})`;
                ctx!.fill();
            }

            // Subtle high-watermark dashed line
            const maxVal = Math.max(...points) + phase;
            const hwmY = H - maxVal * H * 0.8 - 20;
            ctx!.setLineDash([3, 6]);
            ctx!.strokeStyle = `rgba(${bronze[0]}, ${bronze[1]}, ${bronze[2]}, 0.12)`;
            ctx!.lineWidth = 0.5;
            ctx!.beginPath();
            ctx!.moveTo(0, hwmY);
            ctx!.lineTo(W, hwmY);
            ctx!.stroke();
            ctx!.setLineDash([]);

            t += 0.016;
            animId = requestAnimationFrame(draw);
        }

        draw();
        return () => cancelAnimationFrame(animId);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full object-contain pointer-events-none select-none"
        />
    );
}
