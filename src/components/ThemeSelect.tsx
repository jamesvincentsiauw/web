'use client'

import { useEffect, useSyncExternalStore } from 'react'

import { Dropdown, type DropdownOption } from './Dropdown'
import { THEME_CHANGE_EVENT, THEME_STORAGE_KEY, type ThemePreference } from './theme'

const THEME_OPTIONS: ReadonlyArray<DropdownOption<ThemePreference>> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

let memoryPreference: ThemePreference = 'light'

const isPreference = (value: unknown): value is ThemePreference => value === 'light' || value === 'dark' || value === 'system'

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isPreference(stored) ? stored : memoryPreference
  } catch {
    return memoryPreference
  }
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(THEME_CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(THEME_CHANGE_EVENT, callback)
  }
}

function applyTheme(preference: ThemePreference) {
  const dark = preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

export function ThemeSelect() {
  const preference = useSyncExternalStore(subscribe, readPreference, () => 'light' as ThemePreference)

  useEffect(() => {
    applyTheme(preference)
    if (preference !== 'system') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [preference])

  function choose(next: ThemePreference) {
    memoryPreference = next
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage unavailable: the choice lasts for this page view.
    }
    applyTheme(next)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }

  return <Dropdown className="theme-select" label="Theme" value={preference} options={THEME_OPTIONS} onChange={choose} align="end" />
}
