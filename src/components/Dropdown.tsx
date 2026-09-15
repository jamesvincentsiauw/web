'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

export type DropdownOption<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  label: string
  value: T
  options: ReadonlyArray<DropdownOption<T>>
  onChange: (value: T) => void
  /** Keep the label for screen readers only. */
  hideLabel?: boolean
  /** Which edge of the trigger the list aligns to. Use "end" near the right edge of the screen. */
  align?: 'start' | 'end'
  className?: string
}

const TYPEAHEAD_RESET_MS = 500

/**
 * Accessible custom dropdown following the WAI-ARIA listbox pattern: a button opens a listbox,
 * focus moves to the list, and the active option is exposed with aria-activedescendant.
 * Keyboard: Enter/Space/ArrowDown/ArrowUp open; arrows, Home, End move; Enter/Space select;
 * Escape closes without changing; Tab closes; typing jumps to a matching option.
 */
export function Dropdown<T extends string>({ label, value, options, onChange, hideLabel = false, align = 'start', className }: Props<T>) {
  const id = useId()
  const labelId = `${id}-label`
  const buttonId = `${id}-button`
  const listId = `${id}-listbox`
  const optionId = (index: number) => `${id}-option-${index}`

  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const typeahead = useRef({ text: '', at: 0 })

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const lastIndex = options.length - 1

  useEffect(() => {
    if (open) listRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' })
    // optionId is derived from the stable useId value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex])

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  function openList(index = selectedIndex) {
    setActiveIndex(index)
    setOpen(true)
  }

  function close({ restoreFocus = true } = {}) {
    setOpen(false)
    if (restoreFocus) buttonRef.current?.focus()
  }

  function select(index: number) {
    const option = options[index]
    if (option && option.value !== value) onChange(option.value)
    close()
  }

  /** `now` is the keyboard event timestamp, used only to reset the typed prefix after a pause. */
  function matchTypeahead(key: string, now: number): number | null {
    const buffer = now - typeahead.current.at > TYPEAHEAD_RESET_MS ? key : typeahead.current.text + key
    typeahead.current = { text: buffer, at: now }
    const needle = buffer.toLowerCase()
    const start = open ? activeIndex + 1 : selectedIndex + 1
    const ordered = [...options.slice(start), ...options.slice(0, start)]
    const match = ordered.find((option) => option.label.toLowerCase().startsWith(needle))
    return match ? options.indexOf(match) : null
  }

  function onButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        event.preventDefault()
        openList()
        return
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          const index = matchTypeahead(event.key, event.timeStamp)
          if (index !== null) openList(index)
        }
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, lastIndex))
        return
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
        return
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        return
      case 'End':
        event.preventDefault()
        setActiveIndex(lastIndex)
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        select(activeIndex)
        return
      case 'Escape':
        event.preventDefault()
        close()
        return
      case 'Tab':
        // Return focus to the trigger so Tab continues from there.
        close()
        return
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          const index = matchTypeahead(event.key, event.timeStamp)
          if (index !== null) setActiveIndex(index)
        }
    }
  }

  return (
    <div ref={rootRef} className={['dropdown', className].filter(Boolean).join(' ')}>
      <span id={labelId} className={hideLabel ? 'visually-hidden' : 'dropdown__label'}>
        {label}
      </span>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        className="dropdown__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={`${labelId} ${buttonId}`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onButtonKeyDown}
      >
        <span className="dropdown__value">{options[selectedIndex]?.label}</span>
        <svg className="dropdown__chevron" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-activedescendant={optionId(activeIndex)}
          className={`dropdown__list dropdown__list--${align}`}
          onKeyDown={onListKeyDown}
          onBlur={(event) => {
            if (!rootRef.current?.contains(event.relatedTarget as Node | null)) close({ restoreFocus: false })
          }}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            return (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                data-active={index === activeIndex ? '' : undefined}
                className="dropdown__option"
                onPointerMove={() => setActiveIndex(index)}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => select(index)}
              >
                <svg className="dropdown__check" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                  {isSelected && <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
                {option.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
