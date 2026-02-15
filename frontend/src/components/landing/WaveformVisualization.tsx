import { useEffect, useRef } from 'react';

/**
 * Minimalist waveform graph showing pressure/stress points.
 * Thin lines with faint glows on a dark background.
 */
export default function WaveformVisualization() {
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

        // Pre-generate base waveform shapes
        const waves = [
            { freq: 0.02, amp: 30, phase: 0, speed: 0.4, color: [140, 160, 180] },
            { freq: 0.035, amp: 20, phase: 1.2, speed: 0.6, color: [100, 120, 150] },
            { freq: 0.015, amp: 40, phase: 2.4, speed: 0.25, color: [160, 170, 185] },
        ];

        // Stress points
        const stressPoints = [
            { x: W * 0.22, label: 'σ₁' },
            { x: W * 0.55, label: 'σ₂' },
            { x: W * 0.78, label: 'σ₃' },
        ];

        function draw(time: number) {
            const t = time * 0.001;
            ctx!.clearRect(0, 0, W, H);

            // Horizontal guide lines
            ctx!.strokeStyle = 'rgba(255,255,255,0.03)';
            ctx!.lineWidth = 0.5;
            for (let i = 1; i < 6; i++) {
                const y = (H / 6) * i;
                ctx!.beginPath();
                ctx!.moveTo(0, y);
                ctx!.lineTo(W, y);
                ctx!.stroke();
            }

            // Baseline
            const baseline = H * 0.5;
            ctx!.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx!.lineWidth = 0.5;
            ctx!.setLineDash([4, 4]);
            ctx!.beginPath();
            ctx!.moveTo(0, baseline);
            ctx!.lineTo(W, baseline);
            ctx!.stroke();
            ctx!.setLineDash([]);

            // Y-axis ticks
            ctx!.font = '7px Inter, sans-serif';
            ctx!.fillStyle = 'rgba(255,255,255,0.1)';
            ctx!.textAlign = 'left';
            for (let i = -2; i <= 2; i++) {
                const y = baseline - i * 30;
                if (y > 10 && y < H - 10) {
                    ctx!.fillText(`${(i * 25).toFixed(0)}`, 4, y + 3);
                }
            }

            // Draw waves
            for (const wave of waves) {
                ctx!.beginPath();
                const [r, g, b] = wave.color;

                for (let x = 0; x < W; x++) {
                    const val = Math.sin(x * wave.freq + t * wave.speed + wave.phase)
                        * wave.amp
                        * (1 + 0.3 * Math.sin(x * 0.008 + t * 0.15));
                    const y = baseline - val;

                    if (x === 0) ctx!.moveTo(x, y);
                    else ctx!.lineTo(x, y);
                }

                // Glow layer
                ctx!.strokeStyle = `rgba(${r},${g},${b},0.08)`;
                ctx!.lineWidth = 6;
                ctx!.stroke();

                // Main line
                ctx!.strokeStyle = `rgba(${r},${g},${b},0.35)`;
                ctx!.lineWidth = 1;
                ctx!.stroke();
            }

            // Stress points (vertical markers)
            for (const sp of stressPoints) {
                const pulse = Math.sin(t * 1.5 + sp.x * 0.01) * 0.5 + 0.5;

                // Vertical line
                ctx!.strokeStyle = `rgba(180,140,100,${0.08 + pulse * 0.06})`;
                ctx!.lineWidth = 0.5;
                ctx!.setLineDash([2, 3]);
                ctx!.beginPath();
                ctx!.moveTo(sp.x, 20);
                ctx!.lineTo(sp.x, H - 10);
                ctx!.stroke();
                ctx!.setLineDash([]);

                // Stress marker dot
                const markerY = baseline - waves[0].amp * Math.sin(sp.x * waves[0].freq + t * waves[0].speed + waves[0].phase);
                const grd = ctx!.createRadialGradient(sp.x, markerY, 0, sp.x, markerY, 8);
                grd.addColorStop(0, `rgba(180,150,110,${0.25 + pulse * 0.2})`);
                grd.addColorStop(1, 'rgba(180,150,110,0)');
                ctx!.fillStyle = grd;
                ctx!.beginPath();
                ctx!.arc(sp.x, markerY, 8, 0, Math.PI * 2);
                ctx!.fill();

                ctx!.fillStyle = `rgba(180,150,110,${0.5 + pulse * 0.3})`;
                ctx!.beginPath();
                ctx!.arc(sp.x, markerY, 2, 0, Math.PI * 2);
                ctx!.fill();

                // Label
                ctx!.font = '7px Inter, sans-serif';
                ctx!.fillStyle = `rgba(180,150,110,${0.3 + pulse * 0.15})`;
                ctx!.textAlign = 'center';
                ctx!.fillText(sp.label, sp.x, H - 4);
            }

            // X-axis labels
            ctx!.font = '6px Inter, sans-serif';
            ctx!.fillStyle = 'rgba(255,255,255,0.08)';
            ctx!.textAlign = 'center';
            const months = ['JAN', 'MAR', 'MAY', 'JUL', 'SEP', 'NOV'];
            for (let i = 0; i < months.length; i++) {
                ctx!.fillText(months[i], (W / (months.length + 1)) * (i + 1), H - 4);
            }

            animId = requestAnimationFrame(draw);
        }

        animId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animId);
    }, []);

    return <canvas ref={canvasRef} className="w-full h-auto" />;
}
