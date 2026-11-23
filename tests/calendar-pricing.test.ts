import { describe, it, expect } from 'vitest'
import { experiences } from '../lib/data'
import { formatWholeDollars, quote, unitPriceCentsFor } from '../lib/pricing'
import { bookableRange } from '../lib/dates'
import { dayStatus, daysOfMonth, monthAvailability } from '../lib/availability'

/** Precio del calendario del checkout y estado de cada día. Sin base de datos. */

const online = experiences.find((item) => item.booking === 'online' && item.priceUsd !== null && !item.hidden)!
const forQuote = experiences.find((item) => item.booking === 'quote')!

describe('quote(): el mismo precio en calendario, resumen y cobro', () => {
  it('es el precio por persona del catálogo por el número de personas', () => {
    const price = quote(online, '2026-12-05', 3)!
    expect(price.unitPriceCents).toBe(Math.round(online.priceUsd! * 100))
    expect(price.totalCents).toBe(price.unitPriceCents * 3)
  })

  it('aplica el descuento sobre el subtotal', () => {
    const price = quote({ priceUsd: 45 }, undefined, 2, 25)!
    expect(price.subtotalCents).toBe(9000)
    expect(price.discountCents).toBe(2250)
    expect(price.totalCents).toBe(6750)
  })

  it('las experiencias para cotizar no tienen precio cobrable', () => {
    expect(unitPriceCentsFor(forQuote)).toBeNull()
    expect(quote(forQuote, undefined, 2)).toBeNull()
  })

  it('el calendario muestra dólares enteros', () => {
    expect(formatWholeDollars(9000)).toBe('$90')
    expect(formatWholeDollars(140049)).toBe('$1400')
  })
})

describe('estado de un día para un grupo', () => {
  const base = { bookable: true, closed: false, capacity: 10, taken: 0, people: 3 }

  it('con plazas suficientes se puede reservar', () => {
    expect(dayStatus(base)).toEqual({ status: 'available', remaining: 10 })
  })

  it('con menos plazas que el grupo queda «Solo N»', () => {
    expect(dayStatus({ ...base, taken: 8 })).toEqual({ status: 'limited', remaining: 2 })
  })

  it('el mismo día vuelve a servir si el grupo cabe', () => {
    expect(dayStatus({ ...base, taken: 8, people: 2 }).status).toBe('available')
  })

  it('sin plazas está agotado', () => {
    expect(dayStatus({ ...base, taken: 10 })).toEqual({ status: 'soldOut', remaining: 0 })
    expect(dayStatus({ ...base, taken: 12 }).status).toBe('soldOut')
  })

  it('cerrado por el operador o con cupo 0', () => {
    expect(dayStatus({ ...base, closed: true }).status).toBe('closed')
    expect(dayStatus({ ...base, capacity: 0 }).status).toBe('closed')
  })

  it('sin salida o fuera de plazo', () => {
    expect(dayStatus({ ...base, bookable: false }).status).toBe('unavailable')
  })
})

describe('mes del calendario', () => {
  it('lista todos los días del mes, también en febrero bisiesto', () => {
    expect(daysOfMonth('2026-12')).toHaveLength(31)
    expect(daysOfMonth('2028-02')).toHaveLength(29)
    expect(daysOfMonth('2026-12')[0]).toBe('2026-12-01')
  })

  it('combina cupo, reservas y cierres en dos consultas', async () => {
    const now = new Date('2026-11-23T12:00:00-06:00')
    const { first } = bookableRange(now)
    const month = first.slice(0, 7)
    const days = daysOfMonth(month).filter((date) => date >= first)
    const operating = days.filter((date) => online.weekdays.includes(new Date(`${date}T12:00:00`).getDay()))
    const [full, few, closed, free] = operating

    let queries = 0
    const client = {
      availability: {
        findMany: async () => {
          queries++
          return [{ date: closed, closed: true, capacity: null }]
        },
      },
      booking: {
        groupBy: async () => {
          queries++
          return [
            { date: full, _sum: { people: online.maxPeople } },
            { date: few, _sum: { people: online.maxPeople - 1 } },
          ]
        },
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await monthAvailability(client as any, online, month, 2, now)
    const byDate = new Map(result.map((day) => [day.date, day]))

    expect(queries).toBe(2)
    expect(byDate.get(full)?.status).toBe('soldOut')
    expect(byDate.get(few)).toMatchObject({ status: 'limited', remaining: 1, totalCents: null })
    expect(byDate.get(closed)?.status).toBe('closed')
    expect(byDate.get(free)).toMatchObject({
      status: 'available',
      remaining: online.maxPeople,
      totalCents: quote(online, free, 2)!.totalCents,
    })
  })
})
