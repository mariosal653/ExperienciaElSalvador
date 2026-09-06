'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Locale } from '@/lib/data'

/**
 * Idioma de la interfaz.
 *
 * El sitio arranca en INGLÉS porque el visitante principal es el viajero
 * internacional. La preferencia se guarda en localStorage y sobrevive a la
 * navegación y a futuras visitas.
 *
 * Se inicializa siempre en 'EN' y la preferencia guardada se aplica en un
 * efecto: leer localStorage durante el render provocaría un desajuste de
 * hidratación, porque el servidor no tiene acceso a él.
 */

const STORAGE_KEY = 'experience-sv-lang'
const DEFAULT_LOCALE: Locale = 'EN'

type LanguageContextValue = {
  lang: Locale
  setLang: (lang: Locale) => void
  toggle: () => void
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LOCALE,
  setLang: () => {},
  toggle: () => {},
})

function isLocale(value: unknown): value is Locale {
  return value === 'ES' || value === 'EN'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>(DEFAULT_LOCALE)

  // Recupera la preferencia una vez montado en el cliente.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isLocale(stored) && stored !== DEFAULT_LOCALE) {
        setLangState(stored)
      }
    } catch {
      // Modo privado o almacenamiento bloqueado: se queda en el idioma por defecto.
    }
  }, [])

  // Mantiene <html lang> sincronizado: lo usan los lectores de pantalla y
  // los buscadores para saber en qué idioma está la página.
  useEffect(() => {
    document.documentElement.lang = lang === 'ES' ? 'es' : 'en'
  }, [lang])

  const setLang = useCallback((next: Locale) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Sin almacenamiento: el idioma dura lo que dure la pestaña.
    }
  }, [])

  const toggle = useCallback(() => {
    setLangState((current) => {
      const next: Locale = current === 'EN' ? 'ES' : 'EN'
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // idem
      }
      return next
    })
  }, [])

  const value = useMemo(() => ({ lang, setLang, toggle }), [lang, setLang, toggle])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext)
}
