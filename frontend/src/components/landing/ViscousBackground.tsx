import { useEffect, useRef } from 'react';

/**
 * Full-screen canvas background simulating dark, viscous ferrofluid / molten metal.
 *
 * Performance-optimised approach:
 *  - Renders at very low resolution (~120×68 px) and lets CSS upscale with blur
 *  - Throttled to ~12 fps (the motion is slow — no visual difference)
 *  - Only 2 noise octaves + cheap specular approximation
 *  - Total: ~8 000 pixels × 3 noise calls × 12fps ≈ 290 000 noise/s (was 240 000 000)
 */
export default function ViscousBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        let animId = 0;
        let w = 0;
        let h = 0;

        /* ── simplex 3-D noise (self-contained) ────────────────── */
        const F3 = 1 / 3, G3 = 1 / 6;
        const grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
        ];
        const perm = new Uint8Array(512);
        const p12 = new Uint8Array(512);
        {
            const p = new Uint8Array(256);
            for (let i = 0; i < 256; i++) p[i] = i;
            for (let i = 255; i > 0; i--) {
                const j = (Math.random() * (i + 1)) | 0;
                [p[i], p[j]] = [p[j], p[i]];
            }
            for (let i = 0; i < 512; i++) {
                perm[i] = p[i & 255];
                p12[i] = perm[i] % 12;
            }
        }

        function noise3D(xin: number, yin: number, zin: number): number {
            const s = (xin + yin + zin) * F3;
            const i = Math.floor(xin + s);
            const j = Math.floor(yin + s);
            const k = Math.floor(zin + s);
            const t = (i + j + k) * G3;
            const x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);

            let i1: number, j1: number, k1: number,
                i2: number, j2: number, k2: number;
            if (x0 >= y0) {
                if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
                else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
                else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
            } else {
                if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
                else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
                else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
            }

            const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
            const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
            const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;

            const ii = i & 255, jj = j & 255, kk = k & 255;
            const dot = (gi: number, x: number, y: number, z: number) =>
                grad3[gi][0] * x + grad3[gi][1] * y + grad3[gi][2] * z;

            let n = 0;
            let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
            if (t0 > 0) { t0 *= t0; n += t0 * t0 * dot(p12[ii + perm[jj + perm[kk]]], x0, y0, z0); }
            let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
            if (t1 > 0) { t1 *= t1; n += t1 * t1 * dot(p12[ii + i1 + perm[jj + j1 + perm[kk + k1]]], x1, y1, z1); }
            let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
            if (t2 > 0) { t2 *= t2; n += t2 * t2 * dot(p12[ii + i2 + perm[jj + j2 + perm[kk + k2]]], x2, y2, z2); }
            let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
            if (t3 > 0) { t3 *= t3; n += t3 * t3 * dot(p12[ii + 1 + perm[jj + 1 + perm[kk + 1]]], x3, y3, z3); }
            return 32 * n;
        }

        /* ── resize (tiny internal resolution) ─────────────────── */
        const SCALE = 0.06;   // ~115×65 on a 1920×1080 screen
        function resize() {
            w = Math.max(40, Math.round(window.innerWidth * SCALE));
            h = Math.max(24, Math.round(window.innerHeight * SCALE));
            canvas!.width = w;
            canvas!.height = h;
        }
        resize();
        window.addEventListener('resize', resize);

        /* ── throttled render (~12 fps) ────────────────────────── */
        const FRAME_INTERVAL = 1000 / 12;
        let lastFrame = 0;

        function render(time: number) {
            animId = requestAnimationFrame(render);

            if (time - lastFrame < FRAME_INTERVAL) return;
            lastFrame = time;

            const T = time * 0.00012;            // 3× faster overall movement

            const img = ctx!.createImageData(w, h);
            const data = img.data;

            for (let py = 0; py < h; py++) {
                const ny = py / h;
                for (let px = 0; px < w; px++) {
                    const nx = px / w;

                    // Two octaves — higher frequency = smaller features
                    const n1 = noise3D(nx * 5.0, ny * 5.0, T);
                    const n2 = noise3D(nx * 10.0 + 3.7, ny * 10.0 + 1.3, T * 1.6) * 0.45;
                    const raw = n1 + n2;

                    // Specular — higher freq noise = smaller highlights, steeper power = tighter spots
                    const tilt = noise3D(nx * 12.0 + 10, ny * 12.0 + 10, T * 1.2);
                    const spec = Math.pow(Math.max(0, tilt), 10) * 0.75;

                    // Base colour (near black with cold specular)
                    const base = 3 + raw * 2;
                    const r = base + spec * 120 | 0;
                    const g = base + spec * 135 | 0;
                    const b = base + spec * 160 | 0;

                    const idx = (py * w + px) << 2;
                    data[idx] = r < 0 ? 0 : r > 255 ? 255 : r;
                    data[idx + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
                    data[idx + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
                    data[idx + 3] = 255;
                }
            }

            ctx!.putImageData(img, 0, 0);
        }

        animId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full"
            style={{
                zIndex: 0,
                /* CSS upscales the tiny canvas; filter adds organic softness */
                imageRendering: 'auto',
                filter: 'blur(8px) brightness(1.1)',
                transform: 'scale(1.05)',           /* hide blurred edges */
            }}
        />
    );
}
