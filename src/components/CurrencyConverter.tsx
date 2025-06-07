import React, { useState, useEffect } from 'react'
import { currencyService, SUPPORTED_CURRENCIES } from '../lib/currency'
import { ChevronDown } from 'lucide-react'

interface CurrencyConverterProps {
  amount: number
  baseCurrency: string
  className?: string
}

export function CurrencyConverter({ amount, baseCurrency, className = '' }: CurrencyConverterProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(baseCurrency)
  const [convertedAmount, setConvertedAmount] = useState(amount)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    convertAmount()
  }, [amount, baseCurrency, selectedCurrency])

  const convertAmount = async () => {
    if (selectedCurrency === baseCurrency) {
      setConvertedAmount(amount)
      return
    }

    setLoading(true)
    try {
      const converted = await currencyService.convertCurrency(amount, baseCurrency, selectedCurrency)
      setConvertedAmount(converted)
    } catch (error) {
      console.error('Error converting currency:', error)
      setConvertedAmount(amount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="font-semibold text-lg text-green-600">
          {loading ? (
            <span className="animate-pulse">Calculando...</span>
          ) : (
            currencyService.formatCurrency(convertedAmount, selectedCurrency)
          )}
        </span>
        
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            <span>{selectedCurrency}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {SUPPORTED_CURRENCIES.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => {
                    setSelectedCurrency(currency.code)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                    selectedCurrency === currency.code ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{currency.code}</span>
                    <span className="text-sm text-gray-500">{currency.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedCurrency !== baseCurrency && (
        <p className="text-xs text-gray-500 mt-1">
          Convertido desde {currencyService.formatCurrency(amount, baseCurrency)} {baseCurrency}
        </p>
      )}
    </div>
  )
}