import { useEffect, useRef } from 'react';

/**
 * Animated grid of slowly scrolling data rows — evokes a data archive / library.
 */
export default function GridVisualization() {
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

        // Generate rows of "data"
        const ROWS = 18;
        const rows = Array.from({ length: ROWS }, (_, i) => ({
            cols: Array.from({ length: 5 + Math.floor(Math.random() * 4) }, () => ({
                w: 20 + Math.random() * 40,
                bright: 0.03 + Math.random() * 0.06,
            })),
            y: i * 12,
            speed: 0.08 + Math.random() * 0.12,
            offset: Math.random() * 200,
        }));

        function draw(time: number) {
            const t = time * 0.001;
            ctx!.clearRect(0, 0, W, H);

            // Column headers
            ctx!.font = '6px Inter, sans-serif';
            ctx!.fillStyle = 'rgba(255,255,255,0.06)';
            ctx!.textAlign = 'left';
            const headers = ['ID', 'DATE', 'CLASS', 'METRIC', 'STATUS', 'REF', 'TAG', 'SRC', 'VER'];
            let hx = 8;
            for (const h of headers) {
                ctx!.fillText(h, hx, 10);
                hx += 38;
            }

            // Separator
            ctx!.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx!.lineWidth = 0.5;
            ctx!.beginPath();
            ctx!.moveTo(8, 15);
            ctx!.lineTo(W - 8, 15);
            ctx!.stroke();

            // Scrolling rows
            for (const row of rows) {
                const yBase = 22 + ((row.y + t * row.speed * 30 + row.offset) % (ROWS * 12));
                if (yBase < 16 || yBase > H - 4) continue;

                // Fade at edges
                const edgeFade = Math.min(1, (yBase - 16) / 20, (H - 4 - yBase) / 20);

                let x = 8;
                for (const col of row.cols) {
                    const pulse = Math.sin(t * 0.5 + x * 0.02 + row.y) * 0.5 + 0.5;
                    const alpha = col.bright * edgeFade * (0.7 + pulse * 0.3);

                    // Data block
                    ctx!.fillStyle = `rgba(180,190,200,${alpha})`;
                    const h = 5;
                    const radius = 1;
                    const bx = x, by = yBase - h / 2, bw = col.w, bh = h;
                    ctx!.beginPath();
                    ctx!.moveTo(bx + radius, by);
                    ctx!.lineTo(bx + bw - radius, by);
                    ctx!.quadraticCurveTo(bx + bw, by, bx + bw, by + radius);
                    ctx!.lineTo(bx + bw, by + bh - radius);
                    ctx!.quadraticCurveTo(bx + bw, by + bh, bx + bw - radius, by + bh);
                    ctx!.lineTo(bx + radius, by + bh);
                    ctx!.quadraticCurveTo(bx, by + bh, bx, by + bh - radius);
                    ctx!.lineTo(bx, by + radius);
                    ctx!.quadraticCurveTo(bx, by, bx + radius, by);
                    ctx!.fill();

                    x += col.w + 6;
                    if (x > W - 20) break;
                }
            }

            animId = requestAnimationFrame(draw);
        }

        animId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animId);
    }, []);

    return <canvas ref={canvasRef} className="w-full h-auto" />;
}
