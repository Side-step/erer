import React, { Component } from "react";
import PropTypes from "prop-types";
import { Input as ValueLinkInput } from "sw-valuelink";
import { constants } from 'helpers'
import cx from "classnames";
import { ignoreProps } from "helpers";
import reducers from "redux/core/reducers";
import { isMobile } from "react-device-detect";

import cssModules from "react-css-modules";
import styles from "./Input.scss";
import "./style.css"
import TextArea from "components/forms/TextArea/TextArea";


const isDark = localStorage.getItem(constants.localStorage.isDark)
@cssModules(styles, { allowMultiple: true })
export default class Input extends Component {
  static propTypes = {
    className: PropTypes.string,
    rootClassName: PropTypes.string,
    inputClassName: PropTypes.string,
    placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    type: PropTypes.string,
    valueLink: PropTypes.object.isRequired,
    focusOnInit: PropTypes.bool,
    multiline: PropTypes.bool,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    required: PropTypes.bool,
    icon: PropTypes.bool,
    intl: PropTypes.object
  };

  static defaultProps = {
    focusOnInit: false,
    multiline: false,
    disabled: false,
    readOnly: false,
    required: false,
    type: "text"
  };

  handleFocus = () => {
    const { onFocus } = this.props;

    if (onFocus) {
      onFocus();
    }

    if (isMobile) {
      const header = document.getElementById('header-mobile')
      if (header) {
        header.classList.add("hidden-header")
      }
    }
    reducers.inputActive.setInputActive(true);
  };

  handleBlur = () => {
    const { onBlur } = this.props;

    if (onBlur) {
      onBlur();
    }

    if (isMobile) {
      const header = document.getElementById('header-mobile')
      if (header) {
        header.classList.remove("hidden-header")
      }
    }
    reducers.inputActive.setInputActive(false);
  };

  render() {
    const {
      className,
      inputContainerClassName,
      inputClassName,
      errorStyle,
      openScan,
      qr,
      smallFontSize,
      valueLink: { error },
      valueLink,
      dontDisplayError,
      inputCustomStyle,
      withMargin,
      multiline,
      focusOnInit,
      disabled,
      readOnly,
      type,
      fiat,
      srollingForm,
      activeFiat,
      ...rest
    } = this.props;

    const inputContainerStyleName = cx("inputContainer", {
      withError: error,
      withMargin: withMargin,
      smallFontSize: smallFontSize
    });

    const focusEvent = !isMobile
      ? {}
      : {
        onFocus: this.handleFocus,
        onBlur: this.handleBlur
      };

    let style = errorStyle ? "input inputError" : "input ";
    if (srollingForm) {
      style = style + "srollingForm";
    }

    return (
      <div styleName={`root ${isDark ? '--dark' : ''}`} className={className}>
        <div styleName={inputContainerStyleName} className={inputContainerClassName}>
          {React.createElement(multiline ? TextArea : ValueLinkInput, {
            ...ignoreProps(rest, "styles"),
            styleName: style,
            className: inputClassName,
            style: inputCustomStyle,
            valueLink,
            type,
            disabled: disabled || readOnly,
            autoFocus: !!focusOnInit,
            dir: "auto",
            autoComplete: "off",
            ...focusEvent
          })}
          {fiat > 0 && <p styleName="dollar">{`~${fiat}`}{activeFiat}</p>}
          {qr && (
            <p styleName="rightEl qr">
              <i className="fas fa-qrcode" onClick={openScan} />
            </p>
          )}
        </div>
        {Boolean(error && !dontDisplayError) && <div styleName="error">{error}</div>}
      </div>
    );
  }
}
