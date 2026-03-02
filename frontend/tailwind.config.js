/** @type {import('tailwindcss').Config} */
module.exports = {
  // Disable the oxide engine to prevent native binding issues
  experimental: {
    optimizeUniversalDefaults: false,
  },
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-family-heading)', 'Poppins', 'sans-serif'],
        body: ['var(--font-family-body)', 'Inter', 'sans-serif'],
        mono: ['var(--font-family-code)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--ml-blue)',
          light: 'var(--ml-blue-light)',
          dark: 'var(--ml-blue-dark)',
        },
        success: {
          DEFAULT: 'var(--ml-green)',
          light: 'var(--ml-green-light)',
          dark: 'var(--ml-green-dark)',
        },
        danger: {
          DEFAULT: 'var(--ml-red)',
          light: 'var(--ml-red-light)',
          dark: 'var(--ml-red-dark)',
        },
        warning: {
          DEFAULT: 'var(--ml-yellow)',
        },
        accent: {
          DEFAULT: 'var(--ml-orange)',
          light: 'var(--ml-orange-light)',
          dark: 'var(--ml-orange-dark)',
        },
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        'focus-primary': 'var(--shadow-focus-ring-primary)',
        'glow-primary': 'var(--shadow-glow-primary)',
      },
    },
  },
  plugins: [],
}