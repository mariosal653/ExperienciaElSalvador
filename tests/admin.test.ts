import { describe, it, expect } from 'vitest'
import { parseFilters, hasFilters, toSearchParams, describeFilters } from '../lib/admin/filters'
import { experiences } from '../lib/data'

/**
 * Filtros del panel de administración.
 *
 * Los valores llegan por la URL, o sea que los escribe cualquiera. Lo que
 * se prueba aquí es que nada de lo que venga de fuera acabe en una
 * consulta a la base sin comprobar: fechas que no existen, experiencias
 * inventadas, estados que no son estados.
 */

describe('filtros del panel', () => {
  it('sin parámetros no filtra nada', () => {
    const filters = parseFilters({})
    expect(filters).toEqual({
      from: null,
      to: null,
      experienceId: null,
      destination: null,
      status: null,
      paymentStatus: null,
      onlyReal: false,
    })
    expect(hasFilters(filters)).toBe(false)
  })

  it('acepta un rango de fechas válido', () => {
    const filters = parseFilters({ from: '2026-09-01', to: '2026-09-30' })
    expect(filters.from).toBe('2026-09-01')
    expect(filters.to).toBe('2026-09-30')
    expect(hasFilters(filters)).toBe(true)
  })

  it('descarta fechas con formato incorrecto', () => {
    expect(parseFilters({ from: '01/09/2026' }).from).toBeNull()
    expect(parseFilters({ from: 'ayer' }).from).toBeNull()
    expect(parseFilters({ to: "2026-09-01'; DROP TABLE bookings;--" }).to).toBeNull()
  })

  it('descarta fechas que no existen en el calendario', () => {
    expect(parseFilters({ from: '2026-02-31' }).from).toBeNull()
    expect(parseFilters({ from: '2026-13-01' }).from).toBeNull()
  })

  it('un rango al revés se ordena en vez de devolver una lista vacía', () => {
    const filters = parseFilters({ from: '2026-09-30', to: '2026-09-01' })
    expect(filters.from).toBe('2026-09-01')
    expect(filters.to).toBe('2026-09-30')
  })

  it('el atajo de mes se traduce a un rango completo', () => {
    expect(parseFilters({ mes: '2026-02' })).toMatchObject({ from: '2026-02-01', to: '2026-02-28' })
    // 2028 es bisiesto: el último día lo calcula el calendario, no una tabla.
    expect(parseFilters({ mes: '2028-02' })).toMatchObject({ from: '2028-02-01', to: '2028-02-29' })
    expect(parseFilters({ mes: '2026-12' })).toMatchObject({ from: '2026-12-01', to: '2026-12-31' })
  })

  it('el atajo de año cubre el año entero', () => {
    expect(parseFilters({ anio: '2026' })).toMatchObject({ from: '2026-01-01', to: '2026-12-31' })
  })

  it('un mes inventado no filtra', () => {
    expect(parseFilters({ mes: '2026-13' }).from).toBeNull()
    expect(parseFilters({ anio: '26' }).from).toBeNull()
  })

  it('from y to explícitos mandan sobre el atajo', () => {
    const filters = parseFilters({ mes: '2026-09', from: '2026-09-10', to: '2026-09-12' })
    expect(filters.from).toBe('2026-09-10')
    expect(filters.to).toBe('2026-09-12')
  })

  it('solo acepta experiencias que existen en el catálogo', () => {
    const real = experiences[0].id
    expect(parseFilters({ experiencia: real }).experienceId).toBe(real)
    expect(parseFilters({ experiencia: 'no-existe' }).experienceId).toBeNull()
    expect(parseFilters({ experiencia: '../../etc/passwd' }).experienceId).toBeNull()
  })

  it('solo acepta destinos que existen en el catálogo', () => {
    const real = experiences[0].destination
    expect(parseFilters({ destino: real }).destination).toBe(real)
    expect(parseFilters({ destino: 'Atlántida' }).destination).toBeNull()
  })

  it('solo acepta estados reales de reserva', () => {
    expect(parseFilters({ estado: 'CONFIRMED' }).status).toBe('CONFIRMED')
    expect(parseFilters({ estado: 'PENDING_PAYMENT' }).status).toBe('PENDING_PAYMENT')
    expect(parseFilters({ estado: 'confirmed' }).status).toBeNull()
    expect(parseFilters({ estado: 'CUALQUIERA' }).status).toBeNull()
  })

  it('por defecto se ven TODAS las reservas, incluidas las de prueba', () => {
    // Al reves —que era como estaba— el panel salia vacio mientras el
    // proyecto funcionara en modo de pruebas, que es su estado normal.
    expect(parseFilters({}).onlyReal).toBe(false)
    expect(parseFilters({ solo: '' }).onlyReal).toBe(false)
    expect(parseFilters({ solo: 'todas' }).onlyReal).toBe(false)
    expect(parseFilters({ solo: 'reales' }).onlyReal).toBe(true)
    expect(hasFilters(parseFilters({ solo: 'reales' }))).toBe(true)
  })

  it('solo acepta estados reales de pago', () => {
    expect(parseFilters({ pago: 'APPROVED' }).paymentStatus).toBe('APPROVED')
    expect(parseFilters({ pago: 'NONE' }).paymentStatus).toBe('NONE')
    expect(parseFilters({ pago: 'aprobado' }).paymentStatus).toBeNull()
    expect(parseFilters({ pago: 'PAID' }).paymentStatus).toBeNull()
  })

  it('se queda con el primer valor cuando un parámetro llega repetido', () => {
    expect(parseFilters({ from: ['2026-09-01', '2026-01-01'] }).from).toBe('2026-09-01')
  })
})

describe('filtros hacia la URL de descarga', () => {
  it('lo que se ve es lo que se exporta: mismos parametros', () => {
    const filters = parseFilters({
      from: '2026-09-01',
      to: '2026-09-30',
      experiencia: experiences[0].id,
      estado: 'CONFIRMED',
      pago: 'APPROVED',
      solo: 'reales',
    })
    const params = toSearchParams(filters)

    expect(params.get('from')).toBe('2026-09-01')
    expect(params.get('to')).toBe('2026-09-30')
    expect(params.get('experiencia')).toBe(experiences[0].id)
    expect(params.get('estado')).toBe('CONFIRMED')
    expect(params.get('pago')).toBe('APPROVED')
    expect(params.get('solo')).toBe('reales')
  })

  it('un filtro vacio no ensucia la URL', () => {
    expect(toSearchParams(parseFilters({})).toString()).toBe('')
  })

  it('volver a leer los parametros generados da los mismos filtros', () => {
    const original = parseFilters({ mes: '2026-09', estado: 'COMPLETED', pago: 'DECLINED' })
    const params = Object.fromEntries(toSearchParams(original))
    expect(parseFilters(params)).toEqual(original)
  })

  it('el PDF describe los filtros aplicados en una linea', () => {
    expect(describeFilters(parseFilters({}))).toMatch(/Sin filtros/)
    const texto = describeFilters(
      parseFilters({ from: '2026-09-01', to: '2026-09-30', estado: 'CONFIRMED', solo: 'reales' }),
    )
    expect(texto).toContain('2026-09-01')
    expect(texto).toContain('2026-09-30')
    expect(texto).toContain('Confirmada')
    expect(texto).toContain('Solo cobros reales')
  })
})
