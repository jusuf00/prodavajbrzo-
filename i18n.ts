import { getRequestConfig } from 'next-intl/server'

// Can be imported from a shared config
export const locales = ['en', 'mk'] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    locale = 'en'
  }

  return {
    locale: locale as string,
    messages: (await import(`./messages/${locale}.json`)).default
  }
})