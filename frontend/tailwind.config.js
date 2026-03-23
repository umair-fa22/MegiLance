/** @type {import('tailwindcss').Config} */
module.exports = {
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
        'soft-lg': '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 40px rgba(69, 115, 223, 0.06)',
        'soft-xl': '0 30px 60px rgba(0, 0, 0, 0.12), 0 0 60px rgba(69, 115, 223, 0.08)',
        'glow': '0 0 50px rgba(69, 115, 223, 0.15)',
        'glow-lg': '0 0 80px rgba(69, 115, 223, 0.2), 0 20px 50px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        sm: 'blur(4px)',
        md: 'blur(12px)',
        lg: 'blur(20px)',
        xl: 'blur(40px)',
      },
      textShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        glow: '0 0 10px rgba(69, 115, 223, 0.4)',
      },
      animation: {
        'float-slow': 'float 4s ease-in-out infinite',
        'float-medium': 'float 3s ease-in-out infinite',
        'float-fast': 'float 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'gradient-flow': 'gradientFlow 8s ease infinite',
        'morph': 'morph 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 0px rgba(69, 115, 223, 0))' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 15px rgba(69, 115, 223, 0.6))' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        gradientFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        morph: {
          '0%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
        },
      },
    },
  },
  plugins: [],
}