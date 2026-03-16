import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-hover': 'var(--card-hover)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        muted: 'var(--muted)',
        surface: 'var(--surface)',
        'surface-text': 'var(--surface-text)',
        'ehl-black': 'var(--ehl-black)',
        'ehl-dark': 'var(--ehl-dark)',
        'ehl-green': 'var(--ehl-green)',
        'ehl-gold': 'var(--ehl-gold)',
        'ehl-gold-lt': 'var(--ehl-gold-lt)',
        'ehl-gold-dim': 'var(--ehl-gold-dim)',
      },
      fontFamily: {
        sans: ['DM Sans', 'var(--font-geist-sans)', 'Arial', 'Helvetica', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
