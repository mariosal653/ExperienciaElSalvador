import { describe, it, expect } from 'vitest'
import { GUIDE_PER_DAY_USD, HOURLY_USD, MIN_HOURS, VEHICLE_SEATS, getService, services, vehicle } from '../lib/services'
import { quoteBody, quoteSubject } from '../lib/quote'
import { buildMessage } from '../lib/whatsapp'

/**
 * Servicio de conductor y cotización. Sin base de datos.
 *
 * Lo que se protege aquí no es el diseño, sino las condiciones
 * comerciales: que solo exista Personal Driver, que la capacidad sea una
 * sola cifra en todo el sitio y que la tarifa publicada sea la confirmada.
 */

describe('servicio de conductor', () => {
  it('solo queda Personal Driver (Driver by Tour se retiró)', () => {
    expect(services.map((service) => service.name)).toEqual(['Personal Driver'])
    expect(getService('driver-by-tour')).toBeUndefined()
  })

  it('las condiciones acordadas son las publicadas', () => {
    expect(VEHICLE_SEATS).toBe(7)
    expect(HOURLY_USD).toBe(30)
    expect(GUIDE_PER_DAY_USD).toBe(75)
    expect(vehicle.model).toBe('Chevrolet N400')
  })

  it('la foto del vehículo es la real, sin aviso de ilustración', () => {
    expect(vehicle.illustration).toBe(false)
    expect(vehicle.image.src).toMatch(/\.(png|jpe?g)$/)
  })

  it('Personal Driver publica la tarifa por hora, con mínimo de 5 horas', () => {
    const service = getService('personal-driver')
    expect(service?.priceFromUsd).toBe(HOURLY_USD)
    expect(service?.priceUnitCode).toBe('HUR')
    expect(MIN_HOURS).toBe(5)
    expect(service?.priceNote?.ES).toMatch(/mínimo 5 horas/i)
    expect(service?.priceNote?.EN).toMatch(/5-hour minimum/i)
    expect(service?.notes.ES.join(' ')).not.toMatch(/sin mínimo/i)
  })

  it('la gasolina y la espera van incluidas, no excluidas', () => {
    const service = getService('personal-driver')!
    expect(service.includes.ES).toContain('Gasolina')
    expect(service.includes.EN).toContain('Fuel')
    expect(service.includes.ES.some((item) => /espera/i.test(item))).toBe(true)
    expect(service.excludes.ES).not.toContain('Gasolina')
  })

  it('el servicio tiene texto en los dos idiomas', () => {
    for (const service of services) {
      for (const field of [service.tagline, service.summary, service.description, service.priceUnit]) {
        expect(field.ES.length).toBeGreaterThan(0)
        expect(field.EN.length).toBeGreaterThan(0)
      }
      for (const list of [service.highlights, service.includes, service.excludes, service.notes]) {
        expect(list.ES.length).toBe(list.EN.length)
      }
    }
  })
})

describe('cotización', () => {
  it('el mensaje de WhatsApp nombra el servicio y manda sobre el resto', () => {
    const message = buildMessage({ lang: 'ES', service: 'Personal Driver', destination: 'El Tunco' })
    expect(message).toContain('Personal Driver')
    expect(message).not.toContain('El Tunco')
  })

  it('el correo lleva el servicio en el asunto y las preguntas en el cuerpo', () => {
    const lead = { lang: 'EN' as const, service: 'Personal Driver' }
    expect(quoteSubject(lead)).toContain('Personal Driver')
    expect(quoteBody(lead)).toContain('Number of passengers:')
  })
})
