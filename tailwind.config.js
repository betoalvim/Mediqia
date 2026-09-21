/** Gerado a partir da config que estava inline no index.html (play CDN).
 *  Compila o CSS estatico em vendor/tailwind.css para o PWA rodar sem rede. */
module.exports = {
  content: ['./index.html', './app.js', './database.js'],

      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "surface-tint": "#5e5e5e", "background": "#F2F5F3", "primary-container": "#1b1b1b", "tertiary": "#000000", "on-tertiary-fixed": "#1b1b1b", "surface-bright": "#F2F5F3", "on-surface": "#122B1E", "secondary": "#A3E635", "on-tertiary": "#ffffff", "inverse-surface": "#2f3131", "on-error-container": "#93000a", "on-tertiary-fixed-variant": "#474747", "on-secondary-fixed-variant": "#464747", "primary-fixed-dim": "#c6c6c6", "on-surface-variant": "#556B5F", "surface-dim": "#dadada", "on-primary-fixed": "#1b1b1b", "error-container": "#ffdad6", "surface-container-high": "#e8e8e8", "secondary-container": "#e1dfdf", "inverse-on-surface": "#f1f1f1", "surface": "#F2F5F3", "on-primary-fixed-variant": "#474747", "surface-variant": "#e2e2e2", "surface-container": "#eeeeee", "outline": "#B6C2B6", "primary": "#122B1E", "on-primary": "#ffffff", "inverse-primary": "#c6c6c6", "tertiary-container": "#1b1b1b", "surface-container-low": "#f3f3f3", "secondary-fixed": "#e4e2e2", "on-secondary-fixed": "#1b1c1c", "on-background": "#122B1E", "error": "#ba1a1a", "surface-container-lowest": "#ffffff", "tertiary-fixed-dim": "#c6c6c6", "on-tertiary-container": "#848484", "on-secondary": "#122B1E", "surface-container-highest": "#e2e2e2", "on-error": "#ffffff", "on-primary-container": "#848484", "secondary-fixed-dim": "#c7c6c6", "on-secondary-container": "#626262", "primary-fixed": "#e2e2e2", "outline-variant": "rgba(182, 194, 182, 0.3)", "tertiary-fixed": "#e2e2e2"
          },
          boxShadow: {
            'clay-sm': '0 4px 10px rgba(18,43,30,0.05)',
            'clay-md': '0 10px 20px rgba(18,43,30,0.1)',
            'clay-lg': '0 20px 40px rgba(18,43,30,0.15)',
            'clay-inner': 'inset 2px 2px 4px rgba(255,255,255,0.7), inset -2px -2px 4px rgba(18,43,30,0.05)',
            'clay-inner-btn': 'inset 1px 1px 2px rgba(255,255,255,0.3), inset -1px -1px 2px rgba(0,0,0,0.1)'
          },
          spacing: {
            'xxs': '4px',
            'xs': '8px',
            'sm': '12px',
            'md': '16px',
            'lg': '24px',
            'xl': '32px',
            'xxl': '48px',
            'gutter': '24px',
            'container-padding': '24px'
          }
        }
      },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')]
};
