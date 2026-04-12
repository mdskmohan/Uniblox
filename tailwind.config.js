/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['SF Mono', 'Consolas', 'Monaco', 'monospace'],
    },
    extend: {
      colors: {
        surface: {
          primary:   'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary:  'var(--bg-tertiary)',
          hover:     'var(--bg-hover)',
        },
        ink: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary:  'var(--text-tertiary)',
        },
        line: {
          DEFAULT: 'var(--border)',
          strong:  'var(--border-strong)',
        },
        brand: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-hover)',
          light:   'var(--accent-light)',
          text:    'var(--accent-text)',
        },
        positive: {
          DEFAULT: 'var(--success)',
          light:   'var(--success-light)',
          text:    'var(--success-text)',
        },
        caution: {
          DEFAULT: 'var(--warning)',
          light:   'var(--warning-light)',
          text:    'var(--warning-text)',
        },
        destructive: {
          DEFAULT: 'var(--danger)',
          light:   'var(--danger-light)',
          text:    'var(--danger-text)',
        },
        violet: {
          DEFAULT: 'var(--purple)',
          light:   'var(--purple-light)',
          text:    'var(--purple-text)',
        },
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
        xs:   ['12px', { lineHeight: '1.4' }],
        sm:   ['13px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.5' }],
        md:   ['15px', { lineHeight: '1.5' }],
        lg:   ['16px', { lineHeight: '1.4' }],
        xl:   ['20px', { lineHeight: '1.3' }],
        '2xl':['24px', { lineHeight: '1.3' }],
        kpi:  ['32px', { lineHeight: '1' }],
      },
      borderRadius: {
        sm:  '4px',
        DEFAULT: '6px',
        md:  '8px',
        lg:  '12px',
        xl:  '16px',
        full:'9999px',
      },
      spacing: {
        4.5: '18px',
      },
      height: {
        topnav: '52px',
      },
      width: {
        sidebar: '240px',
      },
      minWidth: {
        sidebar: '240px',
      },
      keyframes: {
        spin: { to: { transform: 'rotate(360deg)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideInRight: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        pulse: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
      },
      animation: {
        spin:          'spin 0.6s linear infinite',
        'spin-slow':   'spin 1s linear infinite',
        fadeIn:        'fadeIn 0.15s ease',
        slideUp:       'slideUp 0.2s ease',
        slideInRight:  'slideInRight 0.25s ease',
        pulse:         'pulse 1.5s ease-in-out infinite',
      },
      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.06)',
        modal:  '0 8px 32px rgba(0,0,0,0.12)',
        toast:  '0 4px 16px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
