import React, { PureComponent, Fragment } from 'react'
import cssModules from 'react-css-modules'

import actions from 'redux/actions'

import styles from './MyOrders.scss'
import RowFeeds from './RowFeeds/RowFeeds'

import { FormattedMessage } from 'react-intl'

@cssModules(styles, { allowMultiple: true })
export default class MyOrders extends PureComponent {

  render() {
    const titles = [
      ' ',
      <FormattedMessage id="MyOrders21" defaultMessage="You have" />,
      <FormattedMessage id="MyOrders20" defaultMessage="You get" />,
      <FormattedMessage id="MyOrders22" defaultMessage="Exchnage rate" />,
      ' ',
    ]
    const { myOrders, declineRequest, acceptRequest, removeOrder } = this.props

    if (myOrders.length === undefined || myOrders.length <= 0) {
      return null
    }

    return (
      <div>
        <table styleName="myOrdersTable">
          <thead>
            <tr>
              {
                titles.map((title, index) =>
                  <th key={index}>{title}</th>
                )
              }
            </tr>
          </thead>
          <tbody>
            {myOrders.map((order, index) => {
              return (<RowFeeds
                key={index}
                row={order}
                declineRequest={declineRequest}
                acceptRequest={acceptRequest}
                removeOrder={removeOrder}
              />)
            })}
          </tbody>
        </table>
      </div>
    )
  }
}
