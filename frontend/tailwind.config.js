/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--color-background)',
                surface: {
                    DEFAULT: 'var(--color-surface)',
                    hover: 'var(--color-surface-hover)',
                    highlight: 'var(--color-surface-highlight)',
                },
                border: {
                    DEFAULT: 'var(--color-border)',
                    hover: 'var(--color-border-hover)',
                    subtle: 'var(--color-border-subtle)',
                },
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                    foreground: 'var(--color-primary-foreground)',
                },
                text: {
                    primary: 'var(--color-text-primary)',
                    secondary: 'var(--color-text-secondary)',
                    muted: 'var(--color-text-muted)',
                },
                muted: 'var(--color-text-muted)',
                success: {
                    DEFAULT: 'var(--color-success)',
                    bg: 'var(--color-success-bg)',
                    fg: 'var(--color-success-fg)',
                },
                destructive: {
                    DEFAULT: 'var(--color-destructive)',
                    bg: 'var(--color-destructive-bg)',
                    fg: 'var(--color-destructive-fg)',
                },
                accent: 'var(--color-accent)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
}
