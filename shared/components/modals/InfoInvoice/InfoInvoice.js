import React, { Component, Fragment } from 'react'
import { Modal } from 'components/modal'
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl'

import actions from 'redux/actions'

import helpers from 'helpers'
import { links, constants } from 'helpers'
import { getFullOrigin } from 'helpers/links'

import cssModules from 'react-css-modules'
import defaultStyles from '../Styles/default.scss'
import styles from './InfoInvoice.scss'
import animateFetching from 'components/loaders/ContentLoader/ElementLoading.scss'

import { ShareLink } from 'components/controls'
import ShareButton from 'components/controls/ShareButton/ShareButton'

import Button from 'components/controls/Button/Button'

import { isMobile } from "react-device-detect"

import imgReady from './images/ready.svg'
import imgPending from './images/pending.svg'
import imgCanceled from './images/cancel.svg'


const langPrefix = 'InvoiceInfoModal'
const langLabels = defineMessages({
  titleFetching: {
    id: `${langPrefix}_TitleFetch`,
    defaultMessage: `Загрузка инвойса...`,
  },
  title: {
    id: `${langPrefix}_Title`,
    defaultMessage: `Инвойс #{number}`,
  },
  destination: {
    id: `${langPrefix}_DestinationAddress`,
    defaultMessage: `Адрес для оплаты {destination}`,
  },
  invoiceSender: {
    id: `${langPrefix}_Sender`,
    defaultMessage: `Отправитель (контакт)`,
  },
  invoiceComment: {
    id: `${langPrefix}_Comment`,
    defaultMessage: `Комментарий`,
  },
  fromAddress: {
    id: `${langPrefix}_FromAddress`,
    defaultMessage: `Адресс отправителя`,
  },
  toAddress: {
    id: `${langPrefix}_ToAddress`,
    defaultMessage: `Адресс плательщика`,
  },
  buttonClose: {
    id: `${langPrefix}_CloseButton`,
    defaultMessage: `Закрыть`,
  },
  payInvoice: {
    id: `${langPrefix}_PayInvoiceButton`,
    defaultMessage: `Оплатить`,
  },
  declimeInvoice: {
    id: `${langPrefix}_DeclimeInvoiceButton`,
    defaultMessage: `Отклонить`,
  },
  shareText: {
    id: `${langPrefix}_ShareInvoiceText`,
    defaultMessage: `Инвойс #{id}-{invoiceNumber} от {contact} на {amount} {type}`,
  },
  shareReady: {
    id: `${langPrefix}_ButtonShareReady`,
    defaultMessage: `Готово`,
  },
  shareInfo: {
    id: `${langPrefix}_ShareLink_InfoText`,
    defaultMessage: `Отправьте эту ссылку плательщику для подтверждения платежа`,
  },
  infoStatusReady: {
    id: `${langPrefix}_InfoStatus_Ready`,
    defaultMessage: `Оплачено`,
  },
  infoStatusDeclimed: {
    id: `${langPrefix}_InfoStatus_Declimed`,
    defaultMessage: `Отклонён`,
  },
  infoStatusPending: {
    id: `${langPrefix}_InfoStatus_Pending`,
    defaultMessage: `Не оплачен`,
  },
})

@injectIntl
@cssModules({
  ...defaultStyles,
  ...styles,
  ...animateFetching,
}, { allowMultiple: true })

export default class InfoInvoice extends React.Component {

  constructor(props) {
    super(props)

    const {
      data: {
        isFetching,
        onFetching,
        invoice,
        uniqhash,
        doshare,
      }
    } = props

    this.state = {
      isFetching,
      invoice,
      uniqhash,
      isCancelled: false,
      isReady: false,
      isPending: true,
      doshare,
      isShareReady: !(doshare),
    }

    if (isFetching && typeof onFetching === 'function') {
      onFetching(this)
    }
  }

  handleCloseButton = () => {
    this.handleClose()
  }

  handleClose = (isLocationChange) => {
    const { name, data, onClose } = this.props

    if (typeof onClose === 'function') {
      onClose(isLocationChange)
    }

    if (typeof data.onClose === 'function') {
      data.onClose(isLocationChange)
    }

    actions.modals.close(name)
  }

  handleShareReady = () => {
    const { history } = this.props
    const { uniqhash } = this.state

    this.setState({
      isShareReady: true,
    }, () => {
      history.push(`#${links.invoice}/${uniqhash}`)
    })
  }

  handlePayInvoice = () => {
    const {
      invoice: {
        invoiceData: invoice = false,
      },
    } = this.state

    if (invoice) {
      const {
        type,
        destAddress,
        fromAddress,
        amount,
        toAddress,
      } = invoice


      const payWallet = actions.user.getWithdrawWallet(type, toAddress)
      if (payWallet) {
        // @ToDo - Добавить проверку по балансу
        let withdrawType = constants.modals.Withdraw

        if (payWallet.isUserProtected) withdrawType = constants.modals.WithdrawMultisigUser
        if (payWallet.isSmsProtected) withdrawType = constants.modals.WithdrawMultisigSMS

        const {
          currency,
          address,
          balance,
          unconfirmedBalance,
        } = payWallet

        actions.modals.open(withdrawType, {
          currency,
          address,
          balance,
          unconfirmedBalance,
          toAddress: destAddress || fromAddress,
          amount: amount,
          invoice,
          onReady: () => {
            this.setState({
              isReady: true,
            })
          },
        })

      } else {
        // No wallet - pay from external wallet
      }
    }
  }

  handleChangeLocation = (newLocation) => {
    const { uniqhash } = this.state

    return newLocation.includes(`#${links.invoice}/${uniqhash}`)
  }

  handleDeclimeInvoice = () => {
    const {
      invoice: {
        invoiceData,
      },
    } = this.state

    actions.modals.open(constants.modals.Confirm, {
      onAccept: async () => {
        await actions.invoices.cancelInvoice(invoiceData.id)
        this.setState({
          isCancelled: true,
        })
      },
    })
  }

  render() {
    const {
      intl,
    } = this.props

    const {
      uniqhash,
      isFetching,
      invoice,
      isCancelled,
      isReady,
      isPending,
      doshare,
      isShareReady,
      isReadyShow,
    } = this.state

    const {
      invoiceData = false,
    } = (invoice || {})

    const modalProps = (!isFetching && invoiceData) ? {
      name: constants.modals.WithdrawModal,
      address: '',
      data: {
        currency: 'BTC',
        amount: invoiceData.amount,
        toAddress: invoiceData.destAddress,
        invoice: invoiceData,
      },
      portalUI: true,
    } : false

    let status = 'pending'
    if (!isFetching && invoiceData) status = invoiceData.status
    if (isCancelled) status = 'cancel'
    if (isReady) status = 'ready'

    const shareText = (!isFetching && invoiceData) ? 'Fetching'
      : intl.formatMessage(langLabels.shareText, invoiceData)


    const shareLink = `${getFullOrigin()}${links.invoice}/${uniqhash}`


    const isPayerSide = (!isFetching && invoice && invoice.direction === 'in')
    const isOwner = (!isFetching && invoice && invoice.isOwner)
    const hasPayer = (!isFetching && invoice && invoice.hasPayer)

    const shareButtonEnabled = isMobile

    const isPayerControlEnabled = (!isCancelled && !isReady && (isPayerSide || (!hasPayer && !isOwner)))

    const buttonsHolderStyles = [`invoiceControlsHolder`, `button-overlay`]
    buttonsHolderStyles.push((shareButtonEnabled) ? `with-share-button` : `without-share-button`)
    if (!isPayerControlEnabled) buttonsHolderStyles.push(`without-pay-control`)

    const modalTitle = (isFetching) ?
      intl.formatMessage(langLabels.titleFetching) :
      intl.formatMessage(langLabels.title, {
        number: `${invoiceData.id}-${invoiceData.invoiceNumber}`,
      })


    let infoIconTitle = ''
    let infoIconUrl = ''

    switch (status) {
      case 'ready':
        infoIconTitle = intl.formatMessage(langLabels.infoStatusReady)
        infoIconUrl = imgReady
        break;
      case 'cancelled':
        infoIconTitle = intl.formatMessage(langLabels.infoStatusDeclimed)
        infoIconUrl = imgCanceled
        break;
      default:
        infoIconTitle = intl.formatMessage(langLabels.infoStatusPending)
        infoIconUrl = imgPending
    }

    return (
      <Modal name={name} title={modalTitle} onClose={this.handleClose} showCloseButton={true} closeOnLocationChange={true} onLocationChange={this.handleChangeLocation}>
        {doshare && !isShareReady && (
          <Fragment>
            <div styleName="convent-overlay">
              <div styleName="share-info">
                <strong>
                  <FormattedMessage { ...langLabels.shareInfo } />
                </strong>
              </div>
              <ShareLink 
                link={shareLink}
                fullSize={true}
              />
            </div>
            <div styleName="button-overlay share-ready-holder">
              <Button
                blue
                onClick={this.handleShareReady}
              >
                <FormattedMessage { ...langLabels.shareReady } />
              </Button>
            </div>
          </Fragment>
        )}
        {isShareReady && (
          <Fragment>
            <div styleName="blockCenter convent-overlay">
              <div className="p-3"  styleName={isFetching ? `animate-fetching` : ``}>
                <div styleName={`statusImgHolder statusImgHolder_${status}`}>
                  <img src={infoIconUrl} title={infoIconTitle} alt={infoIconTitle} />
                  <strong>{infoIconTitle}</strong>
                </div>
                <div styleName="shortInfoHolder">
                  {!isFetching && invoiceData && (
                    <Fragment>
                      <div>
                        <strong styleName="invoiceNumber">
                          <FormattedMessage { ...langLabels.title } values={{number: `${invoiceData.id}-${invoiceData.invoiceNumber}`}} />
                        </strong>
                      </div>
                      <div>
                        <span>
                          <strong>{invoiceData.amount} {invoiceData.type}</strong>
                        </span>
                      </div>
                      <div>
                        <span>
                          <FormattedMessage { ... langLabels.destination } values={{
                            destination: invoiceData.destAddress,
                          }} />
                        </span>
                      </div>
                    </Fragment>
                  )}
                </div>
              </div>

              <table styleName="blockCenter__table" className="table table-borderless">
                <tbody>
                  {isFetching ? (
                    <>
                      <tr>
                        <td styleName="animate-fetching" colSpan="2"></td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <td styleName="header">
                          <FormattedMessage { ...langLabels.invoiceSender} />
                        </td>
                        <td styleName="align-right">
                          {invoiceData.contact}
                        </td>
                      </tr>
                      <tr>
                        <td styleName="header" colSpan="2">
                          <FormattedMessage { ...langLabels.fromAddress } />
                        </td>
                      </tr>
                      <tr>
                        <td styleName="align-right" colSpan="2">
                          <span>{invoiceData.fromAddress} ({invoiceData.invoiceNumber})</span>
                        </td>
                      </tr>
                      {invoiceData.toAddress && (
                        <>
                          <tr>
                            <td styleName="header" colSpan="2">
                              <FormattedMessage { ...langLabels.toAddress } />
                            </td>
                          </tr>
                          <tr>
                            <td styleName="align-right" colSpan="2">
                              <span>{invoiceData.toAddress}</span>
                            </td>
                          </tr>
                        </>
                      )}
                      {invoiceData.label && (
                        <>
                          <tr>
                            <td styleName="header" colSpan="2">
                              <FormattedMessage { ...langLabels.invoiceComment} />
                            </td>
                          </tr>
                          <tr>
                            <td styleName="invoiceComment" colSpan="2">
                              <span>{invoiceData.label}</span>
                            </td>
                          </tr>
                        </>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
            <div styleName={buttonsHolderStyles.join(` `)}>
              {(isPayerControlEnabled && !isFetching && status === 'new') && (
                <Fragment>
                  <div styleName="payControl">
                    <Button
                      blue
                      onClick={this.handlePayInvoice}
                    >
                      <FormattedMessage { ...langLabels.payInvoice } />
                    </Button>
                  </div>
                  <div styleName="payControl">
                    <Button
                      gray
                      onClick={this.handleDeclimeInvoice}
                    >
                      <FormattedMessage { ...langLabels.declimeInvoice } />
                    </Button>
                  </div>
                </Fragment>
              )}
              <div styleName="closeButton">
                <Button
                  blue
                  onClick={this.handleCloseButton}
                >
                  <FormattedMessage { ...langLabels.buttonClose } />
                </Button>
              </div>
              {shareButtonEnabled && (
                <div styleName="shareButton">
                  <ShareButton
                    fullWidth={true}
                    link={`${shareLink}`}
                    title={shareText} />
                </div>
              )}
            </div>
          </Fragment>
        )}
      </Modal>
    )
  }
}