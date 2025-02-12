import tailwindContainerQueries from '@tailwindcss/container-queries'
import type { Config } from 'tailwindcss'
import tailwindAnimate from 'tailwindcss-animate'
import defaultTheme from 'tailwindcss/defaultTheme'
import plugin from 'tailwindcss/plugin'

const config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
    '../../packages/ui/src/**/*.{ts,tsx,js,jsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
      },
    },
    extend: {
      colors: {
        orange: {
          50: '#ffefdb',
          100: '#ffd5ae',
          200: '#ffbb7e',
          300: '#ff9f4c',
          400: '#ff851b',
          500: '#e66b00',
          600: '#b45300',
          700: '#813a00',
          800: '#4f2300',
          900: '#200900',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        accept: {
          DEFAULT: 'hsl(var(--accept))',
          foreground: 'hsl(var(--accept-foreground))',
        },
        reject: {
          DEFAULT: 'hsl(var(--reject))',
          foreground: 'hsl(var(--reject-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
        },

        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },

        otog: {
          orange: {
            DEFAULT: '#ff851b',
            50: '#ffefdb',
            100: '#ffd5ae',
            200: '#ffbb7e',
            300: '#ff9f4c',
            400: '#ff851b',
            500: '#e66b00',
            600: '#b45300',
            700: '#813a00',
            800: '#4f2300',
            900: '#200900',
          },
          blue: {
            DEFAULT: '#17b4e9',
            50: '#dbfaff',
            100: '#b1e9fc',
            200: '#86daf6',
            300: '#58caf1',
            400: '#2dbbeb',
            500: '#17b4e9',
            600: '#027ea4',
            700: '#005a76',
            800: '#00374a',
            900: '#00141d',
          },
          green: {
            DEFAULT: '#41e241',
            50: '#e2fee2',
            100: '#b9f6ba',
            200: '#8eee8e',
            300: '#62e763',
            400: '#38e138',
            500: '#41e241',
            600: '#149b16',
            700: '#0a6f0e',
            800: '#024305',
            900: '#001800',
          },
          red: {
            DEFAULT: '#ff4d4d',
            50: '#ffe2e2',
            100: '#ffb1b2',
            200: '#ff7f7f',
            300: '#ff4d4d',
            400: '#fe1d1b',
            500: '#ff4d4d',
            600: '#b30000',
            700: '#810000',
            800: '#4f0000',
            900: '#200000',
          },
          yellow: {
            DEFAULT: '#ffad33',
            50: '#fff4da',
            100: '#ffe0ae',
            200: '#ffcc7d',
            300: '#ffb74b',
            400: '#ffa31a',
            500: '#ffad33',
            600: '#b36b00',
            700: '#814c00',
            800: '#4f2d00',
            900: '#1f0d00',
          },
        },
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'var(--font-sarabun)',
          ...defaultTheme.fontFamily.sans,
        ],
        heading: ['var(--font-notosans)', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    tailwindAnimate,
    tailwindContainerQueries,
    plugin(({ addUtilities }) => {
      addUtilities({
        '.word-break': {
          'word-break': 'break-word',
        },
        '.hide-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.ring-focus': {
          '@apply ring-ring ring-2 ring-offset-background ring-offset-2 outline-none':
            {},
        },
      })
    }),
  ],
} satisfies Config

export default config
