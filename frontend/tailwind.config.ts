import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            animation: {
                aurora: "aurora 30s linear infinite",
            },
            keyframes: {
                aurora: {
                    from: {
                        backgroundPosition: "50% 50%, 50% 50%",
                    },
                    to: {
                        backgroundPosition: "350% 50%, 350% 50%",
                    },
                },
            },
            colors: {
                // ── Obsidian Luxe Design System ─────────────────────────────
                // Surfaces
                "background":                  "#09090B",
                "surface":                     "#131315",
                "surface-dim":                 "#131315",
                "surface-bright":              "#39393b",
                "surface-container-lowest":    "#0e0e10",
                "surface-container-low":       "#1c1b1d",
                "surface-container":           "#201f22",
                "surface-container-high":      "#2a2a2c",
                "surface-container-highest":   "#353437",
                "surface-variant":             "#353437",
                "on-surface":                  "#e5e1e4",
                "on-surface-variant":          "#d2c5b2",
                "outline":                     "#9b8f7e",
                "outline-variant":             "#4f4537",
                // Primary — champagne gold
                "primary":                     "#f0bf62",
                "primary-container":           "#c4973e",
                "primary-fixed":               "#ffdea7",
                "primary-fixed-dim":           "#f0bf62",
                "on-primary":                  "#412d00",
                "on-primary-container":        "#483100",
                "on-primary-fixed":            "#271900",
                "on-primary-fixed-variant":    "#5e4200",
                "inverse-primary":             "#7c5800",
                // Secondary — violet AI
                "secondary":                   "#c7bfff",
                "secondary-container":         "#44369c",
                "secondary-fixed":             "#e4dfff",
                "secondary-fixed-dim":         "#c7bfff",
                "on-secondary":                "#2d1a85",
                "on-secondary-container":      "#b5abff",
                "on-secondary-fixed":          "#180065",
                "on-secondary-fixed-variant":  "#44369c",
                // Tertiary — rose beauty
                "tertiary":                    "#ffb2b9",
                "tertiary-container":          "#e87f8b",
                "tertiary-fixed":              "#ffdadc",
                "tertiary-fixed-dim":          "#ffb2b9",
                "on-tertiary":                 "#5e1322",
                "on-tertiary-container":       "#651927",
                "on-tertiary-fixed":           "#40000f",
                "on-tertiary-fixed-variant":   "#7c2a37",
                // Error
                "error":                       "#ffb4ab",
                "error-container":             "#93000a",
                "on-error":                    "#690005",
                "on-error-container":          "#ffdad6",
                // Misc
                "inverse-surface":             "#e5e1e4",
                "inverse-on-surface":          "#313032",
                "surface-tint":                "#f0bf62",
                "on-background":               "#e5e1e4",
                // ── Legacy shadcn/ui tokens (kept for backward compat) ───────
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                },
            },
            borderRadius: {
                DEFAULT: '0.125rem',   // 2px — obsidian luxe is very sharp
                sm:      '0.125rem',
                md:      '0.25rem',
                lg:      '0.25rem',    // 4px
                xl:      '0.5rem',     // 8px
                '2xl':   '0.75rem',    // 12px
                '3xl':   '1rem',
                full:    '9999px',
                pill:    '9999px',
            },
            fontFamily: {
                display:  ['var(--font-cormorant)', 'Georgia', 'serif'],
                headline: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
                body:     ['var(--font-inter)', 'system-ui', 'sans-serif'],
                label:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
                mono:     ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
            },
            spacing: {
                'safe-top':    'env(safe-area-inset-top)',
                'safe-bottom': 'env(safe-area-inset-bottom)',
                'safe-left':   'env(safe-area-inset-left)',
                'safe-right':  'env(safe-area-inset-right)',
            },
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    plugins: [require("tailwindcss-animate")],
};
export default config;
