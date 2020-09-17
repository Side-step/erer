import React, { Fragment, useState } from 'react'

import { constants } from 'helpers'

import CSSModules from 'react-css-modules'

import styles from './ContentLoader.scss'
import ContentSection from './components/ContentSection/ContentSection'
import DescrSection from './components/DescrSection/DescrSection'
import BalanceSection from './components/BalanceSection/BalanceSection'
import BannersSection from './components/BannersSection/BannersSection'


const isDark = localStorage.getItem(constants.localStorage.isDark)

function ContentLoader({ empty, inner, rideSideContent, leftSideContent, banners, nonHeader }) {

  return (
    <Fragment>
      {
        rideSideContent ? (
          <div styleName={`animationLoading rideSideContent ${empty ? 'stop' : ''} ${inner ? 'inner' : ''} ${isDark ? '--dark' : ''}`}>
            {
              empty ? (
                <div styleName="textBlock">
                  <p>No transactions</p>
                  <span>There isn't any activity in your account yet</span>
                </div>
              ) : ''
            }
            {!empty && !nonHeader ? <DescrSection /> : ''}
            <ContentSection />
            <ContentSection />
          </div>
        ) : ''
      }
      {
        leftSideContent ? (
          <div styleName={`animationLoading leftSideContent ${isDark ? '--dark' : ''}`}>
            <BalanceSection />
          </div>
        ) : ''
      }
      {
        banners ? (
          <div styleName={`animationLoading banners ${isDark ? '--dark' : ''}`}>
            <BannersSection />
          </div>
        ) : ''
      }
    </Fragment>
  )
}

export default CSSModules(ContentLoader, styles, { allowMultiple: true })

