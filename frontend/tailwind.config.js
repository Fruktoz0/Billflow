/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        line: 'var(--line)',
        accent: {
          DEFAULT: 'var(--accent)',
          strong: 'var(--accent-strong)',
          text: 'var(--accent-text)',
          tint: 'var(--accent-tint)',
          soft: 'var(--accent-soft)',
        },
        'on-accent': 'var(--on-accent)',
        overdue: {
          DEFAULT: 'var(--overdue)',
          bg: 'var(--overdue-bg)',
        },
        soon: {
          DEFAULT: 'var(--soon)',
          bg: 'var(--soon-bg)',
        },
        paid: {
          DEFAULT: 'var(--paid)',
          bg: 'var(--paid-bg)',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        'card': '18px',
        'hero': '24px',
        'control': '12px',
      },
      boxShadow: {
        'sheet': '0 -8px 30px rgba(0, 0, 0, 0.12)',
        'dialog': '0 20px 40px rgba(0, 0, 0, 0.15)',
      },
      maxWidth: {
        'app': '1200px',
      }
    },
  },
  plugins: [],
}
