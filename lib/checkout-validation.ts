/**
 * Reglas de validación de los datos del comprador.
 *
 * Funciones puras, sin dependencias: las usa el formulario (para avisar
 * al momento) y el servidor (que es quien decide). Si solo validara el
 * navegador, bastaría con saltarse el formulario para meter cualquier cosa.
 */

export type CustomerInput = {
  name: string
  email: string
  phone: string
  country?: string
}

export type CustomerField = 'name' | 'email' | 'phone' | 'country'

export type CustomerErrorCode =
  | 'required'
  | 'nameTooShort'
  | 'nameInvalid'
  | 'emailInvalid'
  | 'phoneInvalid'
  | 'tooLong'

export type CustomerErrors = Partial<Record<CustomerField, CustomerErrorCode>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Al menos dos letras (de cualquier alfabeto). */
const HAS_LETTERS = /\p{L}.*\p{L}/u

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function validateCustomer(input: CustomerInput): CustomerErrors {
  const errors: CustomerErrors = {}

  const name = input.name.trim()
  if (!name) errors.name = 'required'
  else if (name.length < 3) errors.name = 'nameTooShort'
  else if (name.length > 80) errors.name = 'tooLong'
  else if (!HAS_LETTERS.test(name) || /[<>{}[\]\\/@#$%^*=_|~`]/.test(name)) errors.name = 'nameInvalid'

  const email = input.email.trim()
  if (!email) errors.email = 'required'
  else if (email.length > 254) errors.email = 'tooLong'
  else if (!EMAIL.test(email)) errors.email = 'emailInvalid'

  const phone = input.phone.trim()
  const digits = phoneDigits(phone)
  if (!phone) errors.phone = 'required'
  // E.164: como máximo 15 dígitos. Menos de 7 no es un teléfono.
  else if (digits.length < 7 || digits.length > 15 || /[^\d\s()+.-]/.test(phone)) errors.phone = 'phoneInvalid'

  if (input.country && input.country.trim().length > 56) errors.country = 'tooLong'

  return errors
}

export const CUSTOMER_ERROR_MESSAGES: Record<'ES' | 'EN', Record<CustomerErrorCode, string>> = {
  ES: {
    required: 'Este campo es obligatorio.',
    nameTooShort: 'Escribe tu nombre completo.',
    nameInvalid: 'Usa solo letras, espacios, apóstrofos o guiones.',
    emailInvalid: 'Revisa el correo: parece incompleto.',
    phoneInvalid: 'Incluye el código de país, p. ej. +503 7000 0000.',
    tooLong: 'Es demasiado largo.',
  },
  EN: {
    required: 'This field is required.',
    nameTooShort: 'Please enter your full name.',
    nameInvalid: 'Use only letters, spaces, apostrophes or hyphens.',
    emailInvalid: 'Check the email address — it looks incomplete.',
    phoneInvalid: 'Include the country code, e.g. +503 7000 0000.',
    tooLong: 'This is too long.',
  },
}
