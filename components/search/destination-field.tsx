'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { MapPin, X } from 'lucide-react'
import { usePopover } from '@/hooks/use-popover'
import { searchDestinations, type Locale } from '@/lib/data'

type Props = {
  value: string | null
  onChange: (value: string | null) => void
  lang: Locale
}

/**
 * Campo «¿A dónde?»: se puede escribir para filtrar o elegir de la lista.
 *
 * El texto escrito es solo un filtro de la lista; el valor que cuenta para
 * la búsqueda es el destino seleccionado. Así no se puede buscar por un
 * lugar que no existe en el catálogo.
 */
export function DestinationField({ value, onChange, lang }: Props) {
  const { open, setOpen, close, containerRef } = usePopover<HTMLDivElement>()
  const [term, setTerm] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = 'destination-options'

  const results = useMemo(() => searchDestinations(term), [term])

  // Al abrir se limpia el filtro para que se vea la lista completa.
  useEffect(() => {
    if (open) {
      setTerm('')
      setHighlighted(0)
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    setHighlighted(0)
  }, [term])

  function select(name: string) {
    onChange(name)
    setTerm('')
    close()
  }

  function clear(event: ReactMouseEvent) {
    event.stopPropagation()
    onChange(null)
    setTerm('')
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setHighlighted((index) => Math.min(results.length - 1, index + 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((index) => Math.max(0, index - 1))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const choice = results[highlighted]
      if (choice) select(choice.name)
    }
  }

  // Con el desplegable abierto el campo muestra lo que se va escribiendo,
  // así que el destino ya elegido pasa al placeholder para no perderlo de vista.
  const placeholder = open && value
    ? value
    : lang === 'ES'
      ? 'Destino o experiencia'
      : 'Destination or experience'

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3 md:rounded-full"
        onClick={() => setOpen(true)}
      >
        <MapPin className="shrink-0 text-[#ee7f47]" size={20} aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[#759096]">
            {lang === 'ES' ? '¿A dónde?' : 'Where to?'}
          </span>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-label={lang === 'ES' ? 'Buscar destino' : 'Search destination'}
            value={open ? term : (value ?? '')}
            onChange={(event) => {
              setTerm(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm font-semibold text-[#173f45] outline-none placeholder:text-[#547176]"
          />
        </span>

        {value && !open && (
          <button
            type="button"
            onClick={clear}
            aria-label={lang === 'ES' ? 'Quitar destino' : 'Clear destination'}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[#759096] transition hover:bg-[#eaf1ed] hover:text-[#173f45]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* El z-30 de este panel es LOCAL: solo compite con sus hermanos.
          Quien decide que tape a la tira de categorias es la capa 30 del
          contenido del heroe. Escala completa en app/globals.css. */}
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+.5rem)] z-30 max-h-72 overflow-y-auto rounded-2xl border border-[#e5ece9] bg-white p-2 shadow-2xl md:min-w-[19rem]">
          <p className="px-3 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-wider text-[#759096]">
            {lang === 'ES' ? 'Destinos en El Salvador' : 'Destinations in El Salvador'}
          </p>

          <ul id={listId} role="listbox">
            {results.map((destination, index) => (
              <li key={destination.id} role="option" aria-selected={value === destination.name}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => select(destination.name)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    index === highlighted ? 'bg-[#eaf1ed]' : 'hover:bg-[#f4f7f5]'
                  }`}
                >
                  <MapPin className="shrink-0 text-[#ee7f47]" size={16} aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold text-[#173f45]">{destination.name}</span>
                    <span className="block text-xs text-[#6a8588]">{destination.region[lang]}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-[#6a8588]">
              {lang === 'ES'
                ? 'No encontramos ese destino. Prueba con Santa Ana o El Tunco.'
                : 'No matching destination. Try Santa Ana or El Tunco.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
