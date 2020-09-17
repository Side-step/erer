import React, { PureComponent, Fragment } from 'react'

import { connect } from 'redaction'
import actions from 'redux/actions'
import Slider from 'pages/Wallet/components/WallerSlider';
import { withRouter } from 'react-router-dom'

import { links, constants } from 'helpers'

import CSSModules from 'react-css-modules'
import styles from 'pages/CurrencyWallet/CurrencyWallet.scss'

import Row from 'pages/History/Row/Row'

import Table from 'components/tables/Table/Table'
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl'
import { localisedUrl } from 'helpers/locale'
import config from 'helpers/externalConfig'
import ContentLoader from 'components/loaders/ContentLoader/ContentLoader'
import lsDataCache from 'helpers/lsDataCache'


const isWidgetBuild = config && config.isWidget
const isDark = localStorage.getItem(constants.localStorage.isDark)


@connect(({ signUp: { isSigned } }) => ({
  isSigned,
}))

@connect(({
  user: {
    btcData,
    ethData,
    ghostData,
    nextData,
    multisigStatus,
    activeFiat,
  },
}) => {
  return {
    data: {
      btc: btcData,
      eth: ethData,
      ghost: ghostData,
      next: nextData,
    },
    multisigStatus,
    activeFiat,
  }
})
@injectIntl
@withRouter
@CSSModules(styles, { allowMultiple: true })
export default class InvoicesList extends PureComponent {
  unmounted = false

  constructor(props) {
    super(props)

    const {
      match: {
        params: {
          type = null,
          address = null,
        },
      },
    } = props

    let items = false
    if (type && address) {
      items = lsDataCache.get(`Invoices_${type.toLowerCase()}_${address.toLowerCase()}`)
    } else {
      items = lsDataCache.get(`Invoices_All`)
    }
    this.state = {
      type,
      address,
      items,
    }
  }

  handleGoWalletHome = () => {
    const { history, intl: { locale } } = this.props

    history.push(localisedUrl(locale, links.wallet))
  }

  fetchItems = () => {
    const {
      type,
      address,
    } = this.state

    if (type && address) {
      // Fetch for one wallet
      actions.invoices.getInvoices({
        currency: type,
        address,
      }).then((items) => {
        lsDataCache.push({
          key: `Invoices_${type.toLowerCase()}_${address.toLowerCase()}`,
          time: 3600,
          data: items,
        })
        if (!this.unmounted) {
          this.setState({ items })
        }
      })
    } else {
      // Fetch for all my wallets
      const wallets = actions.core.getWallets()
      const invoicesData = wallets.map((wallet) => {
        const {
          currency: type,
          address,
        } = wallet

        return {
          type,
          address,
        }
      })
      actions.invoices.getManyInvoices(invoicesData).then((items) => {
        lsDataCache.push({
          key: `Invoices_All`,
          time: 3600,
          data: items,
        })
        if (!this.unmounted) {
          this.setState({ items })
        }
      })
    }
  }

  async componentWillUnmount() {
    console.log('InvoicesList unmounted')
    this.unmounted = true
  }

  async componentDidMount() {
    console.log('InvoicesList mounted')
    this.fetchItems()
  }

  componentDidUpdate(prevProps) {
    let {
      match: {
        params: {
          type = null,
          address = null,
        },
      },
    } = this.props

    let {
      match: {
        params: {
          address: prevAddress = null,
          type: prevType = null,
        },
      },
    } = prevProps

    if ((prevAddress !== address) || (prevType !== type)) {
      let items = false
      if (type && address) {
        items = lsDataCache.get(`Invoices_${type.toLowerCase()}_${address.toLowerCase()}`)
      } else {
        items = lsDataCache.get(`Invoices_All`)
      }
      this.setState({
        type,
        address,
        items,
      }, () => {
        this.fetchItems()
      })
    }
  }

  rowRender = (row, rowIndex) => {
    const {
      history,
      activeFiat,
    } = this.props

    return (
      <Row key={rowIndex} {...row} viewType="invoice" activeFiat={activeFiat} history={history} />
    )
  }

  render() {
    let {
      location,
      intl,
      isSigned,
      onlyTable,
      multisigStatus,
    } = this.props

    const {
      isRedirecting,
      items,
      type,
      address,
    } = this.state

    if (isRedirecting) return null

    let settings = {
      infinite: true,
      speed: 500,
      autoplay: true,
      autoplaySpeed: 6000,
      fade: true,
      slidesToShow: 1,
      slidesToScroll: 1
    };

    const invoicesTable = (
      <div styleName={`currencyWalletActivity ${isDark ? 'darkActivity' : ''}`}>
        <h3>
          <FormattedMessage id="InvoicesList_Title" defaultMessage="Invoices" />
        </h3>
        {(items && items.length > 0) ? (
          <Table rows={items} styleName="currencyHistory" rowRender={this.rowRender} />
        ) : (
          <ContentLoader rideSideContent empty inner />
        )}
      </div>
    )

    if (onlyTable) {
      return invoicesTable
    }

    return (
      <div styleName={`root ${isDark ? 'dark' : ''}`}>
        {isWidgetBuild && !config.isFullBuild && (
          <ul styleName="widgetNav">
            <li styleName="widgetNavItem" onClick={this.handleGoWalletHome}>
              <a href styleName="widgetNavItemLink">
                <FormattedMessage id="MybalanceswalletNav" defaultMessage="Мои кошельки" />
              </a>
            </li>
            <li styleName="widgetNavItem active">
              <a href styleName="widgetNavItemLink">
                <FormattedMessage id="InvoicesList_Title" defaultMessage="Invoices" />
              </a>
            </li>
          </ul>
        )}
        <Fragment>
          <div styleName="currencyWalletWrapper">
            <div styleName="currencyWalletBalance">
              {(items && items.length > 0) ? (
                <div>
                  {/* Right form holder */}
                </div>
              ) : (
                <ContentLoader leftSideContent />
              )}
            </div>
            <div styleName={`currencyWalletActivity ${isDark ? 'darkActivity' : ''}`}>
              {invoicesTable}
            </div>
          </div>
        </Fragment>
      </div>
    )
  }
}
