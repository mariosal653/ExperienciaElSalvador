import { describe, it, expect } from 'vitest'
import {
  GUIDE_PER_DAY_USD,
  HOURLY_USD,
  MIN_HOURS,
  PER_KM_USD,
  VEHICLE_SEATS,
  WAITING_PER_HOUR_USD,
  getService,
  services,
  vehicle,
} from '../lib/services'
import { quoteBody, quoteSubject } from '../lib/quote'
import { buildMessage } from '../lib/whatsapp'

/**
 * Servicios de conductor y cotización. Sin base de datos.
 *
 * Lo que se protege aquí no es el diseño, sino las condiciones
 * comerciales: que no aparezca un tercer servicio en la portada, que la
 * capacidad y el mínimo de horas sean una sola cifra en todo el sitio y
 * que ningún precio se publique sin estar confirmado.
 */

describe('servicios de conductor', () => {
  it('son exactamente dos: Driver by Tour y Personal Driver', () => {
    expect(services.map((service) => service.name)).toEqual(['Driver by Tour', 'Personal Driver'])
  })

  it('las condiciones acordadas son las publicadas', () => {
    expect(VEHICLE_SEATS).toBe(6)
    expect(MIN_HOURS).toBe(3)
    expect(HOURLY_USD).toBe(15)
    expect(GUIDE_PER_DAY_USD).toBe(75)
    expect(PER_KM_USD).toBe(0.75)
    expect(WAITING_PER_HOUR_USD).toBe(5)
    expect(vehicle.model).toBe('Chevrolet N400')
  })

  it('la foto del vehículo es la real, sin aviso de ilustración', () => {
    expect(vehicle.illustration).toBe(false)
    expect(vehicle.image.src).toMatch(/\.(png|jpe?g)$/)
  })

  it('Personal Driver publica la tarifa por hora con su mínimo', () => {
    const service = getService('personal-driver')
    expect(service?.priceFromUsd).toBe(HOURLY_USD)
    expect(service?.priceNote?.ES).toContain(`${MIN_HOURS} horas`)
  })

  it('Driver by Tour publica el kilómetro y avisa de la espera', () => {
    const service = getService('driver-by-tour')
    expect(service?.priceFromUsd).toBe(PER_KM_USD)
    expect(service?.priceUnitCode).toBe('KMT')
    expect(service?.priceNote?.ES).toContain(`$${WAITING_PER_HOUR_USD}`)
  })

  it('la excepción de la espera está escrita en la página del servicio', () => {
    // Traslado de varios puntos a uno: se cobra el viaje, no la espera.
    const notes = getService('driver-by-tour')?.notes
    expect(notes?.ES.some((note) => /no se cobra espera/i.test(note))).toBe(true)
    expect(notes?.EN.some((note) => /no waiting charge/i.test(note))).toBe(true)
  })

  it('cada servicio tiene texto en los dos idiomas', () => {
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

  it('la gasolina queda fuera del Personal Driver', () => {
    expect(getService('personal-driver')?.excludes.ES).toContain('Gasolina')
  })
})

describe('cotización', () => {
  it('el mensaje de WhatsApp nombra el servicio y manda sobre el resto', () => {
    const message = buildMessage({ lang: 'ES', service: 'Personal Driver', destination: 'El Tunco' })
    expect(message).toContain('Personal Driver')
    expect(message).not.toContain('El Tunco')
  })

  it('el correo lleva el servicio en el asunto y las preguntas en el cuerpo', () => {
    const lead = { lang: 'EN' as const, service: 'Driver by Tour' }
    expect(quoteSubject(lead)).toContain('Driver by Tour')
    expect(quoteBody(lead)).toContain('Number of passengers:')
  })
})
