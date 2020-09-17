import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import helpers, { constants } from 'helpers'
import actions from 'redux/actions'
import Link from 'sw-valuelink'
import { connect } from 'redaction'
import config from 'app-config'

import cssModules from 'react-css-modules'

import defaultStyles from '../Styles/default.scss'
import styles from './BtcMultisignConfirmTx.scss'

import { BigNumber } from 'bignumber.js'
import Modal from 'components/modal/Modal/Modal'
import FieldLabel from 'components/forms/FieldLabel/FieldLabel'
import Input from 'components/forms/Input/Input'
import Button from 'components/controls/Button/Button'
import InlineLoader from 'components/loaders/InlineLoader/InlineLoader.js'
import Tooltip from 'components/ui/Tooltip/Tooltip'
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl'
import ReactTooltip from 'react-tooltip'
import { isMobile } from 'react-device-detect'

import links from 'helpers/links'

import redirectTo from 'helpers/redirectTo'
import lsDataCache from 'helpers/lsDataCache'



const langPrefix = `multiSignConfirmTxModal`
const langLabels = defineMessages({
  title: {
    id: `${langPrefix}_Title`,
    defaultMessage: `Подтверждение BTC Multisign транзакции`,
  },
  noticeUp: {
    id: `${langPrefix}_UpNotice`,
    defaultMessage: `Ознакомьтесь с транзакцией и подтвердите её. Если вы против списания, отмените тразакцию`,
  },
  noticeFetching: {
    id: `${langPrefix}_NoticeFetching`,
    defaultMessage: `Загрузка...`,
  },
  confirmTx: {
    id: `${langPrefix}_ConfirmTx`,
    defaultMessage: `Подтвердить`,
  },
  dismatchTx: {
    id: `${langPrefix}_DismatchTx`,
    defaultMessage: `Отклонить`,
  },
  youCantSignThis: {
    id: `${langPrefix}_YouCantSignThisTx`,
    defaultMessage: `У вас нет прав для подписи этой транзакции (проверьте, что у вас создан мультисиг)`,
  },
  goToWallet: {
    id: `${langPrefix}_GoToWalletPage`,
    defaultMessage: `Открыть кошелек`,
  },
  buttonClose: {
    id: `${langPrefix}_ButtonClose`,
    defaultMessage: `Закрыть`,
  },
})

@injectIntl
@connect(
  ({
    user: { btcMultisigUserData },
  }) => ({
    btcData: btcMultisigUserData,
  })
)
@cssModules({ ...defaultStyles, ...styles }, { allowMultiple: true })
export default class BtcMultisignConfirmTx extends React.Component {
  
  static propTypes = {
    name: PropTypes.string,
    data: PropTypes.object,
  }

  constructor(props) {
    super(props)

    this.state = {
      step: `fetchgin`,
      isControlFetching: true,
      isTxHolder: true,
      address: ``,
      amount: ``,
      from: ``,
    }
  }

  componentDidMount() {
    setTimeout(async () => {
      const {
        data: {
          txData,
          txId,
        }
      } = this.props

      if (txId) {
        const txData = await actions.multisigTx.fetchTx(txId)

        const {
          destination: address,
          sender: from,
          amount,
        } = txData


        const wallet = actions.btcmultisig.addressToWallet(from)

        if (!wallet) {
          this.setState({
            step: `dinned`,
          })
          return
        }

        this.setState({
          step: `txInfo`,
          txId,
          txData: {
            ...txData,
            wallet,
          },
          address,
          from,
          amount,
        }, () => {
          // Fetching full tx info (rawTX)
          actions.multisigTx.fetchRawTx( from , txId).then((txAuthedData) => {
            if (txAuthedData) {
              actions.btcmultisig.parseRawTX(txAuthedData.rawTx).then((txDataParsed) => {
                this.setState({
                  txRaw: txAuthedData.rawTx,
                  txData: txDataParsed,
                  isTxHolder: (wallet.publicKey.toString(`Hex`) === txAuthedData.holder),
                  isControlFetching: false,
                })
              })
            } else {
              this.setState({
                step: `dinned`,
              })
            }
          })
        })
      } else {
        const txDataParsed = await actions.btcmultisig.parseRawTX(txData)

        if (!txDataParsed.isOur) {
          this.setState({
            step: `dinned`,
          })
          return
        }

        this.setState({
          step: `txInfo`,
          txRaw: txData,
          txData: txDataParsed,
          address: txDataParsed.to,
          from: txDataParsed.from,
          amount: txDataParsed.amount,
        })
      }
    })
  }

  handleGoToWallet = () => {
    this.handleClose()
  }

  handleConfirm = async() => {
    const {
      txId: useBackendId,
      txRaw,
      txData,
      from,
      address: to,
      amount,
    } = this.state

    const {
      name,
    } = this.props

    this.setState({
      isConfirming: true,
    })

    const signedTX = await actions.btcmultisig.signMultiSign( txRaw , txData.wallet )
    const btcTxId = await actions.btcmultisig.broadcastTx( signedTX )
    let txId = false

    if (btcTxId && btcTxId.txid) txId = btcTxId.txid

    if (useBackendId) {
      const backendId = await actions.multisigTx.confirmTx( from, useBackendId, signedTX, txId )
    }

    if (txId) {
      // Сохраняем транзакцию в кеш
      const txInfoCache = {
        amount,
        senderAddress: from,
        receiverAddress: to,
        confirmed: false,
      }

      lsDataCache.push({
        key: `TxInfo_btc_${txId}`,
        time: 3600,
        data: txInfoCache,
      })

      this.handleClose()

      const txInfoUrl = helpers.transactions.getTxRouter('btc', txId)
      redirectTo(txInfoUrl)
    } else {
      this.setState({
        isError: true,
        isConfirming: false,
      })
    }
  }

  handleReject = async () => {
    const {
      txId: useBackendId,
      txData,
      from,
    } = this.state
    if (useBackendId) {
      const backendId = await actions.multisigTx.rejectTx( from, useBackendId )
      this.handleClose()
    }
  }

  handleClose = () => {
    const { name, data, onClose } = this.props

    if (typeof onClose === 'function') {
      onClose()
    }

    if (typeof data.onClose === 'function') {
      data.onClose()
    }

    actions.modals.close(name)
  }

  render() {
    const {
      name,
      intl,
      data: {
        showCloseButton,
      },
    } = this.props

    const {
      step,
      txData,
      isConfirming,
      address,
      amount,
      from,
      isControlFetching,
      isTxHolder,
    } = this.state

    const { debugShowTXB, debugShowInput, debugShowOutput } = this.state

    const linked = Link.all(this, 'address', 'amount', 'from')

    return (
      <Modal name={name} title={`${intl.formatMessage(langLabels.title)}`} onClose={this.handleClose} showCloseButton={showCloseButton}>
        {step !== `dinned` && (
          <p styleName="notice">
            <FormattedMessage { ... langLabels.noticeUp } />
          </p>
        )}
        <div styleName="confirmTxModal">
          {step === `fetchgin` && (
            <p styleName="notice">
              <FormattedMessage { ... langLabels.noticeFetching } />
            </p>
          )}
          {step === `dinned` && (
            <Fragment>
              <p styleName="rednotes">
                <FormattedMessage { ... langLabels.youCantSignThis } />
              </p>
              <Button
                styleName="buttonCenter"
                blue
                onClick={this.handleGoToWallet}
              >
                <FormattedMessage { ... langLabels.goToWallet } />
              </Button>
            </Fragment>
          )}
          {step === `txInfo` && (
            <Fragment>
              <div styleName="highLevel" style={{ marginBottom: "20px" }}>
                <FieldLabel>
                  <FormattedMessage id="BtcMultisignConfirmTx_FromAddress" defaultMessage="Оплата с кошелька" />{" "}
                </FieldLabel>
                <Input
                  valueLink={linked.from}
                  disabled
                  styleName="input fakeInput"
                  withMargin
                />
              </div>
              <div styleName="highLevel" style={{ marginBottom: "20px" }}>
                <FieldLabel>
                  <FormattedMessage id="Withdrow1194" defaultMessage="Address " />{" "}
                  <Tooltip id="WtH203">
                    <div style={{ textAlign: "center" }}>
                      <FormattedMessage
                        id="WTH275"
                        defaultMessage="Make sure the wallet you{br}are sending the funds to supports {currency}"
                        values={{ br: <br />, currency: `BTC` }}
                      />
                    </div>
                  </Tooltip>
                </FieldLabel>
                <Input
                  valueLink={linked.address}
                  disabled
                  styleName="input fakeInput"
                  withMargin
                />
              </div>
              <div styleName="lowLevel" style={{ marginBottom: "30px" }}>
                <p styleName="balance walletBalance">
                  {txData.wallet.balance} {`BTC`}
                </p>
                <FieldLabel>
                  <FormattedMessage id="Withdrow118" defaultMessage="Amount " />
                </FieldLabel>

                <div styleName="group">
                  <Input
                    styleName="input fakeInput"
                    valueLink={linked.amount}
                    disabled
                  />
                </div>
              </div>
              {(isControlFetching) ? (
                <div styleName="buttonsHolder_fetching">
                  <InlineLoader />
                </div>
              ) : (
                <div styleName="buttonsHolder">
                  {!isTxHolder && (
                    <Button
                      styleName="buttonFull"
                      blue
                      disabled={isConfirming || isTxHolder}
                      onClick={this.handleConfirm}
                      fullWidth
                    >
                      <FormattedMessage { ... langLabels.confirmTx } />
                    </Button>
                  )}
                  <Button
                    styleName="buttonFull"
                    blue
                    disabled={isConfirming}
                    onClick={(isTxHolder) ? this.handleClose : this.handleReject}
                    fullWidth
                  >
                    <FormattedMessage { ...((isTxHolder) ? langLabels.buttonClose : langLabels.dismatchTx) } />
                  </Button>
                </div>
              )}
            </Fragment>
          )}
        </div>
      </Modal>
    )
  }
}
