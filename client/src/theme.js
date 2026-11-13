// Light / dark mode. The choice is saved in this browser and applied by
// setting data-theme on <html>; the colours themselves live in index.css.
const KEY = 'reliefnet_theme'

export const THEMES = [
  ['dark', 'Dark', 'Light text on a dark background.'],
  ['light', 'Light', 'Dark text on a light background.'],
]

export function getTheme() {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function setTheme(theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Storage is blocked: the choice still applies until the page reloads
  }
  applyTheme(theme)
}

export function applyTheme(theme = getTheme()) {
  document.documentElement.dataset.theme = theme
}
