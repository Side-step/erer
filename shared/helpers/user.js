import config from 'app-config'


export const getActivatedCurrencies = () => {
  const currencies = []
  if (!config.opts.curEnabled || config.opts.curEnabled.btc) {
    currencies.push('BTC')
    currencies.push('BTC (SMS-Protected)')
    currencies.push('BTC (PIN-Protected)')
    currencies.push('BTC (Multisig)')
  }
  if (!config.opts.curEnabled || config.opts.curEnabled.eth) currencies.push('ETH')

  if (!config.opts.curEnabled || config.opts.curEnabled.ghost) currencies.push('GHOST')

  if (!config.opts.curEnabled || config.opts.curEnabled.next) currencies.push('NEXT')

  Object.keys(config.erc20).forEach((token) => {
    currencies.push(token.toUpperCase())
  })

  return currencies
}

export const hasNonZeroBalance = (currencies) => {
  const nonZeroBalanceCurrencies =
    currencies.filter(currency => currency.balance > 0)

  return nonZeroBalanceCurrencies.length > 0
}

export const hasSignificantBalance = (currencies) =>
  currencies
    .reduce((accumulator, { name, balance }) => {

      if (accumulator) return true

      // 10$
      if (name === 'BTC' && balance > 0.005) {
        return true
      }

      // 10$
      if (name === 'ETH' && balance > 0.1) {
        return true
      }

      return false
    }, false)

export const notTestUnit = (currencies) =>
  currencies
    .filter(
      ({ name, balance }) =>
        (name === 'ETH' && balance > 0.001) || (name === 'SWAP' && balance > 5))
    .length === 2
