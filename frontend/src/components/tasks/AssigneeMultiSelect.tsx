import React, { useMemo, useRef, useState } from 'react'
import type { User } from '../../types'

interface Props {
  users: User[]                  // all selectable users
  selectedIds: number[]          // currently selected user IDs
  onChange: (ids: number[]) => void
  disabled?: boolean
}

// A lightweight multiselect with autocomplete:
// - type to filter the user list
// - click a result to add them (shown as a removable chip)
// - click the × on a chip (or backspace on empty input) to remove
const AssigneeMultiSelect: React.FC<Props> = ({ users, selectedIds, onChange, disabled = false }) => {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedUsers = useMemo(
    () => users.filter(u => selectedIds.includes(u.id)),
    [users, selectedIds]
  )

  // Filter: not already selected, and name/email matches the query
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users
      .filter(u => !selectedIds.includes(u.id))
      .filter(u => q === '' || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 8)
  }, [users, selectedIds, query])

  const add = (id: number) => {
    onChange([...selectedIds, id])
    setQuery('')
    inputRef.current?.focus()
  }

  const remove = (id: number) => {
    onChange(selectedIds.filter(x => x !== id))
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace on empty input removes the last chip
    if (e.key === 'Backspace' && query === '' && selectedIds.length > 0) {
      remove(selectedIds[selectedIds.length - 1])
    }
  }

  return (
    <div className="relative">
      <div
        className={`w-full min-h-[42px] px-2 py-1.5 border rounded-lg text-sm flex flex-wrap gap-1.5 items-center bg-white focus-within:ring-2 focus-within:ring-indigo-400 border-gray-300 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected chips */}
        {selectedUsers.map(u => (
          <span
            key={u.id}
            className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-medium pl-2 pr-1 py-1 rounded-full"
          >
            {u.name}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(u.id) }}
              className="text-indigo-400 hover:text-indigo-700 leading-none"
              aria-label={`Remove ${u.name}`}
            >
              ✕
            </button>
          </span>
        ))}

        {/* Filter input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)} // delay so click registers
          onKeyDown={handleKeyDown}
          placeholder={selectedUsers.length === 0 ? 'Search team members…' : ''}
          className="flex-1 min-w-[120px] outline-none text-sm py-0.5 bg-transparent"
        />
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map(u => (
            <li key={u.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // keep input focused
                onClick={() => add(u.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1">{u.name}</span>
                <span className="text-xs text-gray-400">{u.role}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() !== '' && suggestions.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
          No matching team members
        </div>
      )}
    </div>
  )
}

export default AssigneeMultiSelect