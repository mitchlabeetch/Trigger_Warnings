/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light theme
        'light-bg-primary': '#ffffff',
        'light-bg-secondary': '#f5f5f5',
        'light-bg-tertiary': '#e0e0e0',
        'light-text-primary': '#000000',
        'light-text-secondary': '#333333',
        'light-text-muted': '#666666',

        // Dark theme
        'dark-bg-primary': '#1a1a1a',
        'dark-bg-secondary': '#2d2d2d',
        'dark-bg-tertiary': '#404040',
        'dark-text-primary': '#ffffff',
        'dark-text-secondary': '#e0e0e0',
        'dark-text-muted': '#999999',

        // Warning colors
        'warning-upcoming': '#ffa500',
        'warning-active': '#dc143c',
        'warning-dismissed': '#888888',

        // Action colors
        'action-primary': '#007bff',
        'action-secondary': '#6c757d',
        'action-danger': '#dc3545',
        'action-success': '#28a745',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'fade-out': 'fadeOut 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
