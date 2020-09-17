import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router'
import cssModules from 'react-css-modules'
import { connect } from 'redaction'
import { constants } from 'helpers'
import { getActivatedCurrencies } from 'helpers/user'
import config from 'app-config'
import actions from 'redux/actions'
import { FormattedMessage, injectIntl } from 'react-intl'
import { isMobile } from 'react-device-detect'

import cx from 'classnames'

import Button from 'components/controls/Button/Button'
import FAQ from 'components/FAQ/FAQ'
import { ModalConductorProvider } from 'components/modal'

import styles from './styles.scss'


const isWidgetBuild = config && config.isWidget
const isDark = localStorage.getItem(constants.localStorage.isDark)

const NewDesignLayout = (props) => {
  const {
    hiddenCoinsList,
    activeFiat,
    children,
    page,
  } = props

  const balanceRef = React.useRef(null) // Create a ref object

  let activeView = 0

  if (page === 'history' && !isMobile) {
    activeView = 1
  }
  if (page === 'invoices') activeView = 2


  const isSweepReady = localStorage.getItem(
    constants.localStorage.isSweepReady
  )
  const isBtcSweeped = actions.btc.isSweeped()
  const isEthSweeped = actions.eth.isSweeped()

  let showSweepBanner = !isSweepReady

  if (isBtcSweeped || isEthSweeped) showSweepBanner = false

  const mnemonic = localStorage.getItem(constants.privateKeyNames.twentywords)

  const [commonState, setCommonState] = useState({
    activeView,
    activePage: page,
    btcBalance: 0,
    activeCurrency: activeFiat.toLowerCase(),
    walletTitle: 'Wallet',
    editTitle: false,
    enabledCurrencies: getActivatedCurrencies(),
    showSweepBanner,
    isMnemonicSaved: mnemonic === `-`,
  })

  const {
    enabledCurrencies,
    infoAboutCurrency
  } = commonState

  let btcBalance = 0
  let fiatBalance = 0
  let changePercent = 0

  const allData = actions.core.getWallets()

  // Набор валют для виджета
  const widgetCurrencies = ['BTC']
  if (!hiddenCoinsList.includes('BTC (SMS-Protected)')) { widgetCurrencies.push('BTC (SMS-Protected)') }
  if (!hiddenCoinsList.includes('BTC (PIN-Protected)')) { widgetCurrencies.push('BTC (PIN-Protected)') }
  if (!hiddenCoinsList.includes('BTC (Multisig)')) { widgetCurrencies.push('BTC (Multisig)') }
  widgetCurrencies.push('ETH')
  if (isWidgetBuild) {
    if (
      window.widgetERC20Tokens &&
      Object.keys(window.widgetERC20Tokens).length
    ) {
      // Multi token widget build
      Object.keys(window.widgetERC20Tokens).forEach((key) => {
        widgetCurrencies.push(key.toUpperCase())
      })
    } else {
      widgetCurrencies.push(config.erc20token.toUpperCase())
    }
  }

  let tableRows = allData.filter(({ currency, address, balance }) =>
    // @ToDo - В будущем нужно убрать проверку только по типу монеты.
    // Старую проверку оставил, чтобы у старых пользователей не вывалились скрытые кошельки

    (
      (!hiddenCoinsList.includes(currency) &&
        !hiddenCoinsList.includes(`${currency}:${address}`)) ||
      balance > 0
    )
  )

  if (isWidgetBuild) {
    // tableRows = allData.filter(({ currency }) => widgetCurrencies.includes(currency))
    tableRows = allData.filter(
      ({ currency, address }) =>
        !hiddenCoinsList.includes(currency) &&
        !hiddenCoinsList.includes(`${currency}:${address}`)
    )
    // Отфильтруем валюты, исключив те, которые не используются в этом билде
    tableRows = tableRows.filter(({ currency }) =>
      widgetCurrencies.includes(currency)
    )
  }

  tableRows = tableRows.filter(({ currency }) =>
    enabledCurrencies.includes(currency)
  )

  tableRows.forEach(({ name, infoAboutCurrency, balance, currency }) => {
    const currName = currency || name

    if (
      (!isWidgetBuild || widgetCurrencies.includes(currName)) &&
      infoAboutCurrency &&
      balance !== 0
    ) {
      if (currName === 'BTC') {
        changePercent = infoAboutCurrency.percent_change_1h
      }
      btcBalance += balance * infoAboutCurrency.price_btc
      fiatBalance += balance * ((infoAboutCurrency.price_fiat) ? infoAboutCurrency.price_fiat : 1)
    }
  })

  return (
    <article className="data-tut-start-widget-tour">
      {window.CUSTOM_LOGO && (
        <img className="cutomLogo" src={window.CUSTOM_LOGO} alt="logo" />
      )}
      <section
        styleName={`wallet ${window.CUSTOM_LOGO ? 'hasCusomLogo' : ''} ${isDark ? 'dark' : ''}`}
      >
        <div
          className="data-tut-store"
          styleName="walletContent"
          ref={balanceRef}
        >
          <div styleName="walletBalance">

            {props.BalanceForm}

            <div
              className={cx({
                [styles.desktopEnabledViewForFaq]: true,
                [styles.faqWrapper]: true,
              })}
            >
              <FAQ />
            </div>
          </div>
          <div
            styleName={cx({
              'yourAssetsWrapper': activeView === 0,
              'activity': activeView === 1 || activeView === 2,
              'active': true,
            })}

          >
            {showSweepBanner && (
              <p styleName="sweepInfo">
                <Button blue onClick={this.handleMakeSweep}>
                  <FormattedMessage
                    id="SweepBannerButton"
                    defaultMessage="Done"
                  />
                </Button>
                <FormattedMessage
                  id="SweepBannerDescription"
                  defaultMessage={`Пожалуйста, переместите все средства на кошельки помеченные "new" 
                      (USDT и остальные токены переведите на Ethereum (new) адрес). 
                      Затем нажмите кнопку "DONE". Старые адреса будут скрыты.`}
                />
              </p>
            )}

            <ModalConductorProvider>
              {children}
            </ModalConductorProvider>
          </div>
          <div
            className={cx({
              [styles.mobileEnabledViewForFaq]: true,
              [styles.faqWrapper]: true,
            })}
          >
            <FAQ />
          </div>
        </div>
      </section>
    </article>
  )
}

export default connect(
  ({
    core: { hiddenCoinsList },
    user,
    user: {
      activeFiat,
      ethData,
      btcData,
      ghostData,
      nextData,
      btcMultisigSMSData,
      btcMultisigUserData,
      btcMultisigUserDataList,
      tokensData,
      isFetching,
      isBalanceFetching,
    },
    currencies: { items: currencies },
    createWallet: { currencies: assets },
    modals,
    ui: { dashboardModalsAllowed },
  }) => {
    let widgetMultiTokens = []
    if (
      window.widgetERC20Tokens &&
      Object.keys(window.widgetERC20Tokens).length
    ) {
      Object.keys(window.widgetERC20Tokens).forEach((key) => {
        widgetMultiTokens.push(key.toUpperCase())
      })
    }
    const tokens =
      config && config.isWidget
        ? window.widgetERC20Tokens &&
          Object.keys(window.widgetERC20Tokens).length
          ? widgetMultiTokens
          : [config.erc20token.toUpperCase()]
        : Object.keys(tokensData).map((k) => tokensData[k].currency)

    const tokensItems = Object.keys(tokensData).map((k) => tokensData[k])

    const allData = [
      btcData,
      ghostData,
      nextData,
      btcMultisigSMSData,
      btcMultisigUserData,
      ethData,
      ...Object.keys(tokensData).map((k) => tokensData[k]),
    ].map(({ account, keyPair, ...data }) => ({
      ...data,
    }))

    const items = (config && config.isWidget
      ? [btcData, ethData, ghostData, nextData]
      : [btcData, btcMultisigSMSData, btcMultisigUserData, ethData]
    ).map((data) => data.currency)

    return {
      tokens,
      items,
      allData,
      tokensItems,
      currencies,
      assets,
      isFetching,
      isBalanceFetching,
      hiddenCoinsList,
      userEthAddress: ethData.address,
      user,
      activeFiat,
      tokensData: {
        ethData,
        btcData,
        ghostData,
        nextData,
        btcMultisigSMSData,
        btcMultisigUserData,
        btcMultisigUserDataList,
      },
      dashboardView: dashboardModalsAllowed,
      modals,
    }
  }
)(
  injectIntl(
    withRouter(cssModules(NewDesignLayout, styles, { allowMultiple: true }))
  )
)
