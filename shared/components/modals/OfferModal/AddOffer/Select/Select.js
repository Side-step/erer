import React, { Fragment } from 'react'
import styles from './Select.scss'
import cssModules from 'react-css-modules'
import FieldLabel from 'components/forms/FieldLabel/FieldLabel'
import { FormattedMessage } from 'react-intl'
import Switching from 'components/controls/Switching/Switching'
import BigNumber from 'bignumber.js'


const Select = ({ balance, changeBalance, switching, isDark }) => {

  return (
    <Fragment>
      <div styleName={`groupField ${isDark ? '--dark' : ''}`}>
        <div styleName="group">
          <span styleName="cell" onClick={() => changeBalance(BigNumber(balance).div(4))}><FormattedMessage id="Select23" defaultMessage="25%" /></span>
          <span styleName="cell" onClick={() => changeBalance(BigNumber(balance).div(4))}><FormattedMessage id="Select25" defaultMessage="50%" /></span>
          <span styleName="cell" onClick={() => changeBalance(BigNumber(balance).div(2))}><FormattedMessage id="Select30" defaultMessage="75%" /></span>
          <span styleName="cell" onClick={() => changeBalance(BigNumber(balance).div(2))}><FormattedMessage id="Select40" defaultMessage="100%" /></span>
        </div>
        <Switching onClick={switching} />
      </div>
    </Fragment>
  )
}

export default cssModules(Select, styles, { allowMultiple: true })
