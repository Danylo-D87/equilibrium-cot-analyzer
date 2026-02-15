import { useEffect, useRef } from 'react';

/**
 * Dark radar-like interface with sweeping beam and detection blips.
 */
export default function RadarVisualization() {
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

        const cx = W / 2;
        const cy = H / 2;
        const maxR = Math.min(W, H) * 0.42;

        // Blips at various angles/distances
        const blips = Array.from({ length: 12 }, () => ({
            angle: Math.random() * Math.PI * 2,
            dist: 0.2 + Math.random() * 0.75,
            size: 1 + Math.random() * 2.5,
            decay: 0,
        }));

        function draw(time: number) {
            const t = time * 0.001;
            ctx!.clearRect(0, 0, W, H);

            // Radar rings
            for (let i = 1; i <= 4; i++) {
                const r = (maxR / 4) * i;
                ctx!.strokeStyle = `rgba(255,255,255,${i === 4 ? 0.08 : 0.04})`;
                ctx!.lineWidth = 0.5;
                ctx!.beginPath();
                ctx!.arc(cx, cy, r, 0, Math.PI * 2);
                ctx!.stroke();
            }

            // Cross-hairs
            ctx!.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx!.lineWidth = 0.5;
            ctx!.beginPath();
            ctx!.moveTo(cx - maxR, cy);
            ctx!.lineTo(cx + maxR, cy);
            ctx!.moveTo(cx, cy - maxR);
            ctx!.lineTo(cx, cy + maxR);
            ctx!.stroke();

            // Diagonal lines
            const d = maxR * 0.707;
            ctx!.strokeStyle = 'rgba(255,255,255,0.02)';
            ctx!.beginPath();
            ctx!.moveTo(cx - d, cy - d);
            ctx!.lineTo(cx + d, cy + d);
            ctx!.moveTo(cx + d, cy - d);
            ctx!.lineTo(cx - d, cy + d);
            ctx!.stroke();

            // Ring labels
            ctx!.font = '6px Inter, sans-serif';
            ctx!.fillStyle = 'rgba(255,255,255,0.1)';
            ctx!.textAlign = 'left';
            for (let i = 1; i <= 4; i++) {
                ctx!.fillText(`${i * 25}%`, cx + 3, cy - (maxR / 4) * i + 10);
            }

            // Sweep beam
            const sweepAngle = t * 0.5;     // slow rotation
            const sweepLen = 0.8;            // radians of tail

            // Sweep gradient (cone)
            for (let a = 0; a < 40; a++) {
                const frac = a / 40;
                const angle = sweepAngle - frac * sweepLen;
                const alpha = (1 - frac) * 0.06;

                ctx!.strokeStyle = `rgba(140,165,190,${alpha})`;
                ctx!.lineWidth = 1;
                ctx!.beginPath();
                ctx!.moveTo(cx, cy);
                ctx!.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
                ctx!.stroke();
            }

            // Sweep leading edge
            ctx!.strokeStyle = 'rgba(170,190,210,0.2)';
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(cx, cy);
            ctx!.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR);
            ctx!.stroke();

            // Blips
            for (const blip of blips) {
                // Calculate angle difference to sweep
                let diff = sweepAngle - blip.angle;
                diff = ((diff % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

                if (diff < 0.1) {
                    blip.decay = 1;     // just swept
                }
                blip.decay *= 0.995;    // slow fade

                if (blip.decay > 0.01) {
                    const bx = cx + Math.cos(blip.angle) * blip.dist * maxR;
                    const by = cy + Math.sin(blip.angle) * blip.dist * maxR;

                    // Glow
                    const grd = ctx!.createRadialGradient(bx, by, 0, bx, by, blip.size * 4);
                    grd.addColorStop(0, `rgba(160,175,195,${blip.decay * 0.3})`);
                    grd.addColorStop(1, 'rgba(160,175,195,0)');
                    ctx!.fillStyle = grd;
                    ctx!.beginPath();
                    ctx!.arc(bx, by, blip.size * 4, 0, Math.PI * 2);
                    ctx!.fill();

                    // Core
                    ctx!.fillStyle = `rgba(190,200,215,${blip.decay * 0.7})`;
                    ctx!.beginPath();
                    ctx!.arc(bx, by, blip.size, 0, Math.PI * 2);
                    ctx!.fill();
                }
            }

            // Center point
            ctx!.fillStyle = 'rgba(255,255,255,0.15)';
            ctx!.beginPath();
            ctx!.arc(cx, cy, 2, 0, Math.PI * 2);
            ctx!.fill();

            // Corner labels
            ctx!.font = '6.5px Inter, sans-serif';
            ctx!.fillStyle = 'rgba(255,255,255,0.08)';
            ctx!.textAlign = 'left';
            ctx!.fillText('GEOPOLITICAL', 6, 14);
            ctx!.textAlign = 'right';
            ctx!.fillText('MACRO', W - 6, 14);
            ctx!.textAlign = 'left';
            ctx!.fillText('CREDIT', 6, H - 6);
            ctx!.textAlign = 'right';
            ctx!.fillText('VOLATILITY', W - 6, H - 6);

            animId = requestAnimationFrame(draw);
        }

        animId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animId);
    }, []);

    return <canvas ref={canvasRef} className="w-full h-auto" />;
}
