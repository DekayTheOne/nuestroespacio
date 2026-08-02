/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-light': 'var(--color-primary-light)',
        accent: 'var(--color-accent)',
        bg: 'var(--color-bg)',
        'bg-elevated': 'var(--color-bg-elevated)',
        ink: 'var(--color-ink)',
        'ink-soft': 'var(--color-ink-soft)',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      keyframes: {
        latido: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.08)' },
          '40%': { transform: 'scale(0.98)' },
          '55%': { transform: 'scale(1.05)' },
        },
        flotar: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateY(-120vh) rotate(20deg)', opacity: '0' },
        },
      },
      animation: {
        latido: 'latido 1.4s ease-in-out infinite',
        flotar: 'flotar 4s ease-in forwards',
      },
    },
  },
  plugins: [],
}
