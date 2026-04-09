/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: '#FCFDFB',
        foreground: '#1C2922',
        card: '#FFFFFF',
        'card-foreground': '#1C2922',
        primary: {
          DEFAULT: '#2B593F',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#E4EBE4',
          foreground: '#1C2922',
        },
        muted: {
          DEFAULT: '#F3F6F4',
          foreground: '#4B5E53',
        },
        accent: {
          DEFAULT: '#F3F6F4',
          foreground: '#1C2922',
        },
        destructive: {
          DEFAULT: '#993333',
          foreground: '#FFFFFF',
        },
        border: '#E4EBE4',
        input: '#E4EBE4',
        ring: '#2B593F',
        success: {
          light: '#EAF5ED',
          dark: '#2B593F',
        },
        warning: {
          light: '#FFF9E6',
          dark: '#B38600',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
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
    },
  },
  plugins: [require('tailwindcss-animate')],
}