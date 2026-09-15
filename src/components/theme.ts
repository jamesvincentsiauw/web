export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'theme'
export const THEME_CHANGE_EVENT = 'portfolio-theme-change'

/**
 * Runs before first paint (inline in <head>) so the stored theme applies without a flash.
 * Light is the default when nothing is stored or storage is unavailable.
 */
export const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement;try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');if(p!=='dark'&&p!=='system')p='light';var dark=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);d.dataset.theme=dark?'dark':'light';}catch(e){d.dataset.theme='light';}})();`
