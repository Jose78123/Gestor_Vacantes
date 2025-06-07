const EXCHANGE_API_KEY = 'e5b1795008a270cbbb5636c57aee3014'
const EXCHANGE_API_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest`

interface ExchangeRates {
  [key: string]: number
}

interface CacheItem {
  rates: ExchangeRates
  timestamp: number
}

const CACHE_KEY = 'exchange_rates_cache'
const CACHE_DURATION = 60 * 60 * 1000 // 1 hora en milisegundos

class CurrencyService {
  private cache: CacheItem | null = null

  constructor() {
    this.loadFromLocalStorage()
  }

  private loadFromLocalStorage() {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        this.cache = JSON.parse(cached)
      }
    } catch (error) {
      console.error('Error loading currency cache:', error)
    }
  }

  private saveToLocalStorage() {
    try {
      if (this.cache) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache))
      }
    } catch (error) {
      console.error('Error saving currency cache:', error)
    }
  }

  private isCacheValid(): boolean {
    if (!this.cache) return false
    const now = Date.now()
    return (now - this.cache.timestamp) < CACHE_DURATION
  }

  async getRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    // Si el cache es válido, usarlo
    if (this.isCacheValid() && this.cache) {
      return this.cache.rates
    }

    try {
      const response = await fetch(`${EXCHANGE_API_URL}/${baseCurrency}`)
      if (!response.ok) {
        throw new Error('Error al obtener tasas de cambio')
      }

      const data = await response.json()
      if (data.result !== 'success') {
        throw new Error('Error en la respuesta de la API')
      }

      const rates = data.conversion_rates
      this.cache = {
        rates,
        timestamp: Date.now()
      }
      this.saveToLocalStorage()

      return rates
    } catch (error) {
      console.error('Error fetching exchange rates:', error)
      
      // Fallback al cache si existe, aunque esté expirado
      if (this.cache) {
        console.warn('Usando cache expirado como fallback')
        return this.cache.rates
      }

      // Fallback básico si no hay cache
      return {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110,
        CAD: 1.25,
        AUD: 1.35,
        CHF: 0.92,
        CNY: 6.45,
        MXN: 20.5,
        BRL: 5.2
      }
    }
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount

    const rates = await this.getRates(fromCurrency)
    const rate = rates[toCurrency]
    
    if (!rate) {
      throw new Error(`Tasa de cambio no disponible para ${toCurrency}`)
    }

    return amount * rate
  }

  getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'CHF',
      CNY: '¥',
      MXN: '$',
      BRL: 'R$',
      COP: '$',
      ARS: '$',
      CLP: '$',
      PEN: 'S/',
      UYU: '$U'
    }
    return symbols[currency] || currency
  }

  formatCurrency(amount: number, currency: string): string {
    const symbol = this.getCurrencySymbol(currency)
    return `${symbol}${amount.toLocaleString('es-ES', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }
}

export const currencyService = new CurrencyService()

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'Dólar Estadounidense' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'Libra Esterlina' },
  { code: 'JPY', name: 'Yen Japonés' },
  { code: 'CAD', name: 'Dólar Canadiense' },
  { code: 'AUD', name: 'Dólar Australiano' },
  { code: 'CHF', name: 'Franco Suizo' },
  { code: 'CNY', name: 'Yuan Chino' },
  { code: 'MXN', name: 'Peso Mexicano' },
  { code: 'BRL', name: 'Real Brasileño' },
  { code: 'COP', name: 'Peso Colombiano' },
  { code: 'ARS', name: 'Peso Argentino' },
  { code: 'CLP', name: 'Peso Chileno' },
  { code: 'PEN', name: 'Sol Peruano' },
  { code: 'UYU', name: 'Peso Uruguayo' }
]