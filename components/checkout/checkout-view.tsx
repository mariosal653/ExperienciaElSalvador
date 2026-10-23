'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CalendarDays, Check, Loader2, Lock, MapPin, Minus, Plus, ShieldCheck, Ticket, Users } from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { useLanguage } from '@/components/i18n/language-provider'
import { useWhatsAppLead } from '@/components/whatsapp/whatsapp-provider'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { DatePicker } from './date-picker'
import { calculatePrice, formatCents } from '@/lib/pricing'
import { experienceName, parseLocalDate, type Locale } from '@/lib/data'
import { track, trackBeginCheckout } from '@/lib/analytics'
import { FREE_CANCELLATION_HOURS } from '@/lib/experience-details'
import { canPayLater, formatDeadline, payLaterDeadline } from '@/lib/pay-later'
import {
  CUSTOMER_ERROR_MESSAGES,
  validateCustomer,
  type CustomerErrors,
  type CustomerField,
} from '@/lib/checkout-validation'

type ExperienceView = {
  id: string
  title: string
  name: Record<Locale, string>
  destination: string
  image: string
  imageAlt: Record<Locale, string>
  priceUsd: number
  durationHours: number
  maxPeople: number
  weekdays: number[]
}

type PaymentMethod = 'wompi' | 'paypal'

/**
 * Qué pasarelas puede usar el comprador. Lo decide el servidor según las
 * credenciales configuradas; aquí solo llegan los modos, nunca claves.
 */
type Methods = {
  wompi: { available: boolean; mode: 'mock' | 'sandbox' | 'production' | null }
  paypal: { available: boolean; mode: 'sandbox' | 'production' | null }
  any: boolean
}

type Props = {
  experience: ExperienceView
  user: { name: string; email: string } | null
  discountPct: number
  methods: Methods
  range: { first: string; last: string }
  initialDate: string | null
  initialPeople: number | null
}

const COUNTRIES = [
  'El Salvador', 'United States', 'Guatemala', 'Honduras', 'Nicaragua', 'Costa Rica', 'Panama', 'Mexico',
  'Canada', 'Spain', 'Colombia', 'Germany', 'France', 'United Kingdom', 'Italy', 'Netherlands', 'Australia',
]

/** Llave de idempotencia. randomUUID exige contexto seguro (https o localhost). */
function newKey(): string {
  const cryptoApi: Crypto = globalThis.crypto
  if (typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID()
  const bytes = new Uint8Array(16)
  cryptoApi.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const SERVER_ERRORS: Record<string, Record<Locale, string>> = {
  soldOut: { ES: 'Ya no quedan plazas suficientes para esa fecha. Elige otra fecha o menos viajeros.', EN: 'There are not enough spots left for that date. Pick another date or fewer travelers.' },
  payLaterUnavailable: { ES: 'Para esta fecha ya no se puede pagar después: elige «Pagar ahora».', EN: 'Pay later is no longer available for this date: choose “Pay now”.' },
  benefitUnavailable: { ES: 'Tu descuento de bienvenida ya no está disponible. Desmárcalo para continuar.', EN: 'Your welcome discount is no longer available. Untick it to continue.' },
  dateTooSoon: { ES: 'Esa fecha ya no se puede reservar. Elige una a partir de mañana.', EN: 'That date can no longer be booked. Pick one from tomorrow onwards.' },
  dateTooFar: { ES: 'Solo se puede reservar con hasta un año de antelación.', EN: 'Bookings open up to one year ahead.' },
  notOperating: { ES: 'La experiencia no sale ese día.', EN: 'This experience does not run on that day.' },
  invalidDate: { ES: 'Elige una fecha válida.', EN: 'Pick a valid date.' },
  tooManyPeople: { ES: 'Hay más viajeros de los que admite el grupo.', EN: 'That is more travelers than the group allows.' },
  paymentsDisabled: { ES: 'El pago en línea no está disponible en este momento. Escríbenos por WhatsApp y te ayudamos.', EN: 'Online payment is unavailable right now. Message us on WhatsApp and we will help.' },
  paymentProviderUnavailable: { ES: 'No pudimos conectar con la pasarela de pago. No se hizo ningún cargo. Intenta de nuevo en un momento.', EN: 'We could not reach the payment gateway. You have not been charged. Please try again shortly.' },
  bookingCancelled: { ES: 'Ese intento no se completó. Vuelve a pulsar el botón para empezar de nuevo.', EN: 'That attempt did not complete. Press the button again to start over.' },
  tooManyRequests: { ES: 'Demasiados intentos seguidos. Espera un minuto.', EN: 'Too many attempts in a row. Please wait a minute.' },
  network: { ES: 'Sin conexión. Revisa tu internet e inténtalo de nuevo.', EN: 'No connection. Check your internet and try again.' },
  generic: { ES: 'No se pudo iniciar el pago. Inténtalo de nuevo.', EN: 'We could not start the payment. Please try again.' },
}

export function CheckoutView({ experience, user, discountPct, methods, range, initialDate, initialPeople }: Props) {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const t = (es_: string, en: string) => (es ? es_ : en)

  const validInitialDate =
    initialDate &&
    initialDate >= range.first &&
    initialDate <= range.last &&
    experience.weekdays.includes(parseLocalDate(initialDate)?.getDay() ?? -1)
      ? initialDate
      : null

  const [date, setDate] = useState<string | null>(validInitialDate)
  const [people, setPeople] = useState(() =>
    Math.min(experience.maxPeople, Math.max(1, initialPeople ?? 2)),
  )
  const [remaining, setRemaining] = useState<number | null>(null)
  const [checkingSeats, setCheckingSeats] = useState(false)

  const [customer, setCustomer] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    country: '',
  })
  const [touched, setTouched] = useState<Partial<Record<CustomerField, boolean>>>({})
  const [serverFieldErrors, setServerFieldErrors] = useState<CustomerErrors>({})
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [useDiscount, setUseDiscount] = useState(discountPct > 0)

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Método de pago. Se preselecciona el primero disponible; si solo hay
  // uno, el selector ni se muestra.
  const [method, setMethod] = useState<PaymentMethod>(() => (methods.wompi.available ? 'wompi' : 'paypal'))

  // «Reserva ahora, paga después»: solo si la salida está lo bastante lejos.
  // El servidor lo vuelve a comprobar; aquí solo decide si se ofrece.
  const [payLaterChoice, setPayLaterChoice] = useState(false)
  const payLaterAllowed = date !== null && canPayLater(date)
  const payLater = payLaterAllowed && payLaterChoice
  const deadline = date ? payLaterDeadline(date) : null
  const choices: PaymentMethod[] = [
    ...(methods.wompi.available ? (['wompi'] as const) : []),
    ...(methods.paypal.available ? (['paypal'] as const) : []),
  ]

  const idempotencyKey = useRef<string>('')
  if (!idempotencyKey.current) idempotencyKey.current = newKey()

  const formRef = useRef<HTMLFormElement>(null)

  // Contexto para el widget de WhatsApp.
  const { setLead } = useWhatsAppLead()
  useEffect(() => {
    setLead({ lang, experience: experience.title, destination: experience.destination, date, people })
  }, [lang, experience.title, experience.destination, date, people, setLead])

  // Analítica: inicio del pago, una vez por visita a esta página.
  useEffect(() => {
    trackBeginCheckout(
      { id: experience.id, name: experience.title, priceUsd: experience.priceUsd, destination: experience.destination, people },
      false,
    )
    // Solo al entrar: los cambios de personas o fecha no son otro inicio.
  }, [experience.id])

  // Una compra distinta necesita una llave distinta. Cambiar lo que se
  // compra genera otra; un doble clic sin cambios reutiliza la misma.
  useEffect(() => {
    idempotencyKey.current = newKey()
  }, [date, people, customer.email, useDiscount, method])

  // Volver desde la pasarela con el botón «atrás» restaura la página desde
  // la caché del navegador con el botón aún en «cargando».
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) setSubmitting(false)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  // Plazas libres para la fecha elegida.
  useEffect(() => {
    if (!date) {
      setRemaining(null)
      return
    }
    const controller = new AbortController()
    setCheckingSeats(true)
    fetch(`/api/availability?experienceId=${encodeURIComponent(experience.id)}&date=${date}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload) return setRemaining(null)
        setRemaining(typeof payload.remaining === 'number' ? payload.remaining : null)
      })
      .catch(() => {})
      .finally(() => setCheckingSeats(false))
    return () => controller.abort()
  }, [date, experience.id])

  const maxPeople = Math.max(1, Math.min(experience.maxPeople, remaining ?? experience.maxPeople))
  useEffect(() => {
    if (remaining !== null && remaining > 0 && people > remaining) setPeople(remaining)
  }, [remaining, people])

  const soldOut = remaining === 0

  // Vista previa. El importe que vale es el que calcula el servidor.
  const unitCents = Math.round(experience.priceUsd * 100)
  const price = calculatePrice(unitCents, people, useDiscount ? discountPct : 0)

  const clientErrors = useMemo(() => validateCustomer(customer), [customer])
  const errors: CustomerErrors = { ...clientErrors }
  for (const [field, code] of Object.entries(serverFieldErrors) as [CustomerField, CustomerErrors[CustomerField]][]) {
    if (code) errors[field] = code
  }
  const showError = (field: CustomerField) => (touched[field] || submitted) && errors[field]

  function update(field: CustomerField, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }))
    setServerFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const dateLabel = date
    ? parseLocalDate(date)?.toLocaleDateString(es ? 'es-SV' : 'en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    setServerError(null)

    const hasErrors = Object.keys(clientErrors).length > 0 || !date || !acceptTerms || soldOut
    if (hasErrors) {
      // Lleva al primer campo con problema.
      requestAnimationFrame(() => {
        const target = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        if (target instanceof HTMLInputElement) target.focus({ preventScroll: true })
      })
      return
    }

    setSubmitting(true)
    track('add_payment_info', {
      currency: 'USD',
      value: experience.priceUsd * people,
      payment_type: payLater ? 'pay_later' : method,
      items: [{ item_id: experience.id, item_name: experience.title, price: experience.priceUsd, quantity: people }],
    })
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceId: experience.id,
          date,
          people,
          customer,
          acceptTerms,
          applyWelcomeDiscount: useDiscount && discountPct > 0,
          idempotencyKey: idempotencyKey.current,
          locale: lang,
          paymentMethod: method,
          payLater,
        }),
      })
      const payload = await response.json().catch(() => ({}))

      // Pagar después: no hay pasarela que visitar; se va a la reserva.
      if (response.ok && payload.payLater && payload.accessToken) {
        window.location.assign(`/booking/${payload.accessToken}`)
        return
      }

      if (response.ok && payload.checkoutUrl) {
        try {
          sessionStorage.setItem('ees:lastBooking', payload.accessToken)
        } catch {
          // Sin almacenamiento: la página de retorno no lo necesita.
        }
        window.location.assign(payload.checkoutUrl)
        return
      }

      if (payload.code === 'alreadyPaid' && payload.accessToken) {
        window.location.assign(`/booking/${payload.accessToken}`)
        return
      }

      if (payload.code === 'invalidCustomer' && payload.fields) {
        setServerFieldErrors(payload.fields)
      }
      if (payload.code === 'soldOut' && typeof payload.remaining === 'number') {
        setRemaining(payload.remaining)
      }
      if (payload.code === 'bookingCancelled' || payload.code === 'paymentProviderUnavailable') {
        idempotencyKey.current = newKey()
      }
      setServerError((SERVER_ERRORS[payload.code] ?? SERVER_ERRORS.generic)[lang])
      setSubmitting(false)
    } catch {
      setServerError(SERVER_ERRORS.network[lang])
      setSubmitting(false)
    }
  }

  const fieldClass = (field: CustomerField) =>
    `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-3 text-base text-brand outline-none transition placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/15 sm:text-sm ${
      showError(field) ? 'border-accent' : 'border-line'
    }`

  const errorText = (field: CustomerField) => {
    const code = showError(field)
    return code ? (
      <p id={`${field}-error`} className="mt-1.5 text-xs font-medium text-accent-deep">
        {CUSTOMER_ERROR_MESSAGES[lang][code]}
      </p>
    ) : null
  }

  const mode = method === 'paypal' ? methods.paypal.mode : methods.wompi.mode

  const testBanner =
    mode === 'mock'
      ? t('Modo de prueba: el pago es simulado y no se cobra nada.', 'Test mode: payment is simulated and nothing is charged.')
      : mode === 'sandbox'
        ? method === 'paypal'
          ? t('PayPal en modo de pruebas (sandbox): usa una cuenta de prueba; no se cobra nada.', 'PayPal test mode (sandbox): use a test account; nothing is charged.')
          : t('Wompi en modo de pruebas: usa una tarjeta de prueba; no se cobra nada.', 'Wompi test mode: use a test card; nothing is charged.')
        : null

  return (
    <div className="min-h-screen bg-cream text-brand">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-5 lg:px-8 lg:pt-10">
        <Link href={`/experiences/${experience.id}`} className="text-sm font-semibold text-accent hover:underline">
          ← {t('Volver a la experiencia', 'Back to the experience')}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">{t('Completa tu reserva', 'Complete your booking')}</h1>
        <p className="mt-1.5 text-sm text-muted">
          {user
            ? t(`Reservando como ${user.email}.`, `Booking as ${user.email}.`)
            : t('No necesitas crear una cuenta.', 'No account needed.')}
        </p>

        {testBanner && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-gold-line bg-gold-pale px-4 py-3 text-sm font-medium text-gold-ink">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {testBanner}
          </p>
        )}

        <form ref={formRef} onSubmit={submit} noValidate className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
          <div className="grid min-w-0 gap-6">
            {/* 1. Fecha */}
            <section aria-labelledby="step-date" className="rounded-2xl bg-white p-4 shadow-card sm:p-6">
              <h2 id="step-date" className="flex items-center gap-2.5 text-base font-semibold">
                <Step n={1} /> <CalendarDays size={17} className="text-accent" /> {t('Fecha', 'Date')}
              </h2>
              <div className="mt-4" data-invalid={submitted && !date ? 'true' : undefined} tabIndex={-1}>
                <DatePicker
                  value={date}
                  onChange={(value) => {
                    setDate(value)
                    setServerError(null)
                  }}
                  weekdays={experience.weekdays}
                  first={range.first}
                  last={range.last}
                  lang={lang}
                  invalid={submitted && !date}
                  describedBy="date-help"
                />
              </div>
              <p id="date-help" className="mt-2 text-xs text-muted" aria-live="polite">
                {submitted && !date ? (
                  <span className="font-medium text-accent-deep">{t('Elige una fecha para continuar.', 'Pick a date to continue.')}</span>
                ) : dateLabel ? (
                  <span className="font-semibold capitalize text-brand">{dateLabel}</span>
                ) : (
                  t('Elige uno de los días marcados.', 'Pick one of the highlighted days.')
                )}
              </p>
            </section>

            {/* 2. Viajeros */}
            <section aria-labelledby="step-people" className="rounded-2xl bg-white p-4 shadow-card sm:p-6">
              <h2 id="step-people" className="flex items-center gap-2.5 text-base font-semibold">
                <Step n={2} /> <Users size={17} className="text-accent" /> {t('Viajeros', 'Travelers')}
              </h2>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPeople((value) => Math.max(1, value - 1))}
                    disabled={people <= 1}
                    aria-label={t('Quitar un viajero', 'Remove a traveler')}
                    className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white transition hover:border-brand disabled:opacity-35"
                  >
                    <Minus size={16} />
                  </button>
                  <output aria-live="polite" className="min-w-[7.5rem] text-center text-base font-semibold">
                    {people} {es ? (people === 1 ? 'persona' : 'personas') : people === 1 ? 'person' : 'people'}
                  </output>
                  <button
                    type="button"
                    onClick={() => setPeople((value) => Math.min(maxPeople, value + 1))}
                    disabled={people >= maxPeople || soldOut}
                    aria-label={t('Agregar un viajero', 'Add a traveler')}
                    className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white transition hover:border-brand disabled:opacity-35"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="text-xs text-muted">
                  {formatCents(unitCents)} {t('por persona', 'per person')}
                </p>
              </div>
              <p className="mt-3 text-xs" aria-live="polite">
                {checkingSeats ? (
                  <span className="text-muted">{t('Consultando plazas…', 'Checking availability…')}</span>
                ) : soldOut ? (
                  <span className="font-semibold text-accent-deep">{t('Sin plazas para esa fecha. Elige otra.', 'Sold out for that date. Pick another one.')}</span>
                ) : remaining !== null && remaining <= 5 ? (
                  <span className="font-semibold text-accent">
                    {es ? `Quedan ${remaining} plazas.` : `Only ${remaining} spots left.`}
                  </span>
                ) : (
                  <span className="text-muted">
                    {t(`Grupos de hasta ${experience.maxPeople} personas. Una entrada con QR por viajero.`, `Groups of up to ${experience.maxPeople}. One QR ticket per traveler.`)}
                  </span>
                )}
              </p>
            </section>

            {/* 3. Datos del comprador */}
            <section aria-labelledby="step-details" className="rounded-2xl bg-white p-4 shadow-card sm:p-6">
              <h2 id="step-details" className="flex items-center gap-2.5 text-base font-semibold">
                <Step n={3} /> {t('Tus datos', 'Your details')}
              </h2>
              <p className="mt-1 text-xs text-muted">
                {t('Te enviaremos la confirmación y las entradas a este correo.', 'We will send your confirmation and tickets to this email.')}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="text-sm font-semibold">{t('Nombre completo', 'Full name')}</label>
                  <input
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={customer.name}
                    onChange={(event) => update('name', event.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                    aria-invalid={Boolean(showError('name'))}
                    aria-describedby={showError('name') ? 'name-error' : undefined}
                    maxLength={80}
                    className={fieldClass('name')}
                  />
                  {errorText('name')}
                </div>
                <div>
                  <label htmlFor="email" className="text-sm font-semibold">{t('Correo electrónico', 'Email')}</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={customer.email}
                    onChange={(event) => update('email', event.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                    aria-invalid={Boolean(showError('email'))}
                    aria-describedby={showError('email') ? 'email-error' : undefined}
                    maxLength={254}
                    className={fieldClass('email')}
                  />
                  {errorText('email')}
                </div>
                <div>
                  <label htmlFor="phone" className="text-sm font-semibold">{t('Teléfono', 'Phone')}</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+503 7000 0000"
                    value={customer.phone}
                    onChange={(event) => update('phone', event.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
                    aria-invalid={Boolean(showError('phone'))}
                    aria-describedby={showError('phone') ? 'phone-error' : undefined}
                    maxLength={30}
                    className={fieldClass('phone')}
                  />
                  {errorText('phone')}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="country" className="text-sm font-semibold">
                    {t('País', 'Country')} <span className="font-normal text-muted">({t('opcional', 'optional')})</span>
                  </label>
                  <input
                    id="country"
                    name="country"
                    list="country-list"
                    autoComplete="country-name"
                    value={customer.country}
                    onChange={(event) => update('country', event.target.value)}
                    aria-invalid={Boolean(showError('country'))}
                    maxLength={56}
                    className={fieldClass('country')}
                  />
                  <datalist id="country-list">
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country} />
                    ))}
                  </datalist>
                  {errorText('country')}
                </div>
              </div>

              {!user && (
                <p className="mt-4 rounded-xl bg-surface-soft px-4 py-3 text-xs text-muted">
                  {t('¿Tienes cuenta? ', 'Have an account? ')}
                  <Link href={`/login?next=${encodeURIComponent(`/checkout/${experience.id}`)}`} className="font-bold text-accent hover:underline">
                    {t('Inicia sesión', 'Sign in')}
                  </Link>
                  {t(' para guardar la reserva en tu perfil y usar tu descuento de bienvenida. Es opcional.', ' to save the booking to your profile and use your welcome discount. It is optional.')}
                </p>
              )}
            </section>
          </div>

          {/* 4. Resumen y pago */}
          <aside aria-labelledby="summary-title" className="h-fit min-w-0 rounded-2xl bg-white p-4 shadow-card sm:p-6 lg:sticky lg:top-6">
            <h2 id="summary-title" className="flex items-center gap-2.5 text-base font-semibold">
              <Step n={4} /> {t('Resumen', 'Summary')}
            </h2>

            <div className="mt-4 flex gap-3">
              <Picture
                src={experience.image}
                sizes="96px"
                alt={experience.imageAlt[lang]}
                width={96}
                height={96}
                decoding="async"
                className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
              />
              <div className="min-w-0">
                <p className="font-semibold leading-snug">{experienceName(experience, lang)}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <MapPin size={12} /> {experience.destination}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {experience.durationHours} {t('horas', 'hours')}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid gap-2.5 border-t border-line-soft pt-4 text-sm">
              <Row label={t('Fecha', 'Date')} value={dateLabel ? <span className="capitalize">{dateLabel}</span> : <span className="text-faint">—</span>} />
              <Row label={t('Viajeros', 'Travelers')} value={String(people)} />
              <Row label={t('Precio por persona', 'Price per person')} value={formatCents(unitCents)} />
              <Row label="Subtotal" value={formatCents(price.subtotalCents)} />
              {price.discountCents > 0 && (
                <Row
                  label={t(`Descuento de bienvenida (${price.discountPct}%)`, `Welcome discount (${price.discountPct}%)`)}
                  value={`−${formatCents(price.discountCents)}`}
                  accent
                />
              )}
              <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line-soft pt-3">
                <dt className="font-semibold">Total</dt>
                <dd className="text-2xl font-semibold" aria-live="polite">
                  {formatCents(price.totalCents)} <span className="text-xs font-normal text-muted">USD</span>
                </dd>
              </div>
            </dl>

            {discountPct > 0 && (
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-gold-soft/35 p-3.5">
                <input
                  type="checkbox"
                  checked={useDiscount}
                  onChange={(event) => setUseDiscount(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                />
                <span className="text-sm">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Ticket size={14} /> {t(`Usar mi ${discountPct}% de bienvenida`, `Use my ${discountPct}% welcome discount`)}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {t('Solo se consume si el pago se completa.', 'Only used if the payment goes through.')}
                  </span>
                </span>
              </label>
            )}

            <label
              className={`mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm ${
                submitted && !acceptTerms ? 'border-accent bg-accent-soft' : 'border-line'
              }`}
              data-invalid={submitted && !acceptTerms ? 'true' : undefined}
            >
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(event) => setAcceptTerms(event.target.checked)}
                aria-invalid={submitted && !acceptTerms}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
              />
              <span className="text-muted">
                {t('Acepto los ', 'I accept the ')}
                <Link href="/legal/terms" target="_blank" className="font-semibold text-brand underline">{t('Términos', 'Terms')}</Link>
                {', '}
                <Link href="/legal/cancellation" target="_blank" className="font-semibold text-brand underline">{t('la Política de cancelación', 'Cancellation Policy')}</Link>
                {t(' y la ', ' and ')}
                <Link href="/legal/privacy" target="_blank" className="font-semibold text-brand underline">{t('Política de privacidad', 'Privacy Policy')}</Link>
                .
              </span>
            </label>

            {/* Cuándo pagar. Solo si la fecha elegida lo permite. */}
            {payLaterAllowed && methods.any && (
              <fieldset className="mt-5">
                <legend className="text-sm font-semibold">{t('¿Cuándo quieres pagar?', 'When would you like to pay?')}</legend>
                <div className="mt-2.5 grid gap-2">
                  {([false, true] as const).map((later) => (
                    <label
                      key={String(later)}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition ${
                        payLater === later ? 'border-brand bg-surface-soft' : 'border-line'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payWhen"
                        checked={payLater === later}
                        onChange={() => {
                          setPayLaterChoice(later)
                          setServerError(null)
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                      />
                      <span>
                        <span className="block font-bold">
                          {later ? t('Reserva ahora, paga después', 'Book now, pay later') : t('Pagar ahora', 'Pay now')}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {later
                            ? t(
                                `Aparta tu lugar sin pagar hoy. Paga cuando quieras antes del ${deadline ? formatDeadline(deadline, 'ES') : ''}.`,
                                `Hold your spot without paying today. Pay any time before ${deadline ? formatDeadline(deadline, 'EN') : ''}.`,
                              )
                            : t('Recibe tus entradas con QR al instante.', 'Get your QR tickets instantly.')}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Método de pago. Solo aparece si hay más de uno: con una
                sola pasarela, elegir no aporta nada. Pagando después se
                elige al pagar. */}
            {choices.length > 1 && !payLater && (
              <fieldset className="mt-5">
                <legend className="text-sm font-semibold">{t('Método de pago', 'Payment method')}</legend>
                <div className="mt-2.5 grid gap-2">
                  {choices.map((choice) => (
                    <label
                      key={choice}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition ${
                        method === choice ? 'border-brand bg-surface-soft' : 'border-line'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={choice}
                        checked={method === choice}
                        onChange={() => {
                          setMethod(choice)
                          setServerError(null)
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                      />
                      <span>
                        <span className="block font-bold">
                          {choice === 'paypal' ? 'PayPal' : t('Tarjeta con Wompi', 'Card with Wompi')}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {choice === 'paypal'
                            ? t(
                                'Paga con tu cuenta de PayPal o con tarjeta a través de PayPal.',
                                'Pay with your PayPal account or with a card through PayPal.',
                              )
                            : t(
                                'Tarjeta de crédito o débito en la página segura de Wompi.',
                                'Credit or debit card on Wompi’s secure page.',
                              )}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {serverError && (
              <p role="alert" className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent-deep">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !methods.any}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-sm font-bold text-white transition hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
              {submitting
                ? payLater
                  ? t('Apartando tu lugar…', 'Holding your spot…')
                  : t('Preparando el pago…', 'Preparing payment…')
                : payLater
                  ? t(`Reservar sin pagar hoy · ${formatCents(price.totalCents)}`, `Book without paying today · ${formatCents(price.totalCents)}`)
                  : mode === 'mock'
                  ? t(`Continuar al pago de prueba · ${formatCents(price.totalCents)}`, `Continue to test payment · ${formatCents(price.totalCents)}`)
                  : method === 'paypal'
                    ? t(`Pagar ${formatCents(price.totalCents)} con PayPal`, `Pay ${formatCents(price.totalCents)} with PayPal`)
                    : t(`Pagar ${formatCents(price.totalCents)} con Wompi`, `Pay ${formatCents(price.totalCents)} with Wompi`)}
            </button>

            {!methods.any && (
              <p className="mt-3 text-center text-xs font-medium text-accent-deep">{SERVER_ERRORS.paymentsDisabled[lang]}</p>
            )}

            {/* Garantías justo antes de pagar: es donde surge la duda. */}
            <ul className="mt-4 grid gap-1.5 rounded-2xl bg-surface-soft p-3.5 text-xs text-brand">
              <li className="flex items-start gap-2">
                <Check size={14} className="mt-px shrink-0 text-success" aria-hidden="true" />
                {t(`Cancelación gratis hasta ${FREE_CANCELLATION_HOURS} h antes`, `Free cancellation up to ${FREE_CANCELLATION_HOURS} h before`)}
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="mt-px shrink-0 text-success" aria-hidden="true" />
                {payLater
                  ? t('Tus entradas con QR llegan a tu correo en cuanto pagues', 'Your QR tickets arrive by email as soon as you pay')
                  : t('Confirmación y entradas con QR al instante en tu correo', 'Instant confirmation and QR tickets by email')}
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="mt-px shrink-0 text-success" aria-hidden="true" />
                {t('Ayuda por WhatsApp antes y durante tu experiencia', 'WhatsApp support before and during your experience')}
              </li>
            </ul>

            <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-xs text-muted">
              <ShieldCheck size={14} className="mt-px shrink-0 text-success-dark" />
              {payLater
                ? t(
                    'Hoy no se cobra nada. Te enviamos el enlace para pagar a tu correo.',
                    'Nothing is charged today. We will email you the link to pay.',
                  )
                : method === 'paypal'
                ? t(
                    'Pagas en la página segura de PayPal. Nunca vemos ni guardamos los datos de tu tarjeta.',
                    "You pay on PayPal's secure page. We never see or store your card details.",
                  )
                : t(
                    'Pagas en la página segura de Wompi. Nunca vemos ni guardamos los datos de tu tarjeta.',
                    "You pay on Wompi's secure page. We never see or store your card details.",
                  )}
            </p>
          </aside>
        </form>
      </main>

      <SiteFooter />
    </div>
  )
}

function Step({ n }: { n: number }) {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white" aria-hidden="true">
      {n}
    </span>
  )
}

function Row({ label, value, accent = false }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-3 ${accent ? 'text-success-dark' : ''}`}>
      <dt className={accent ? '' : 'text-muted'}>{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  )
}
