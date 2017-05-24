(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let React;
  let PropTypes;
  let utils;
  let componentUtils;

  if (isModule) {
    React = require('react');
    PropTypes = require('prop-types');
    utils = require('crizmas-utils');
    componentUtils = require('../utils');
  } else {
    React = window.React;
    PropTypes = window.PropTypes;
    ({utils, componentUtils} = window.crizmas);
  }

  const {Component} = React;
  const {isVal} = utils;
  const {debounce} = componentUtils;

  const defaultDebounce = 100;
  const defaultBoolDebounce = 0;
  const numberRegExp = /^(-|\+)?(((\d+(\.\d*)?)|(\.\d+))(e(-|\+)?\d+)?)$/i;
  const partialNumberRegExp =
    /^(-|\+)?((\d*(\.\d*)?)|((((\d+(\.\d*)?)|(\.\d+))(e(-|\+)?\d*)?)?))$/i;
  const integerRegExp = /^(-|\+)?\d+$/;
  const partialIntegerRegExp = /^(-|\+)?\d*$/;
  const allowedHtmlInputTypes = ['text', 'password', 'email', 'url', 'tel', 'search', 'hidden',
    'radio', 'checkbox'];

  const isBoolHtmlInputType = (type) => type === 'radio' || type === 'checkbox';

  // normalizers convert the final string to the expected value
  const valuesNormalizer = {
    number: (value, initialValue) => {
      if (value === '') {
        return initialValue === undefined
          ? initialValue
          : null;
      }

      return Number(value);
    },

    integer: (value, initialValue) => valuesNormalizer.number(value, initialValue),

    string: (value) => value.trim(),

    text: (value) => valuesNormalizer.string(value),

    textarea: (value) => valuesNormalizer.string(value)
  };

  // type guards disallow unexpected characters in the input
  const valueTypesGuards = {
    number: (value) => {
      return partialNumberRegExp.test(value);
    },

    integer: (value) => {
      return partialIntegerRegExp.test(value);
    }
  };

  // change guards prevent calling the onChange handler with temporary values.
  // an example is 3e for real numbers. the e character must be allowed because
  // the user could enter 3e2, but the intermediary value 3e must not be sent
  // to the client.
  const valueChangeGuards = {
    number: (value) => {
      return value === '' || numberRegExp.test(value);
    },

    integer: (value) => {
      return value === '' || integerRegExp.test(value);
    },

    string: (value, oldValue) => {
      oldValue = oldValue || '';

      if (typeof oldValue === 'string') {
        return oldValue.trim() !== value.trim();
      }

      return true;
    },

    text: (value, oldValue) => valueChangeGuards.string(value, oldValue),

    textarea: (value, oldValue) => valueChangeGuards.string(value, oldValue)
  };

  class Input extends Component {
    constructor(...args) {
      super(...args);

      this.state = {
        value: this.props.value,
        // last normalized value
        oldValue: this.props.value
      };

      this.initOnChange = this.initOnChange.bind(this);

      this.setOnChangeMethod();
    }

    componentWillReceiveProps(newProps) {
      if (newProps.debounce !== this.props.debounce) {
        this.setOnChangeMethod();
      }

      // we must ignore the same value when we have an intermediary string representation
      // like 3.20 (after the 0 there can be a new decimal)
      if (!newProps.isInputPending && newProps.value !== this.state.oldValue) {
        this.setState({
          value: newProps.value,
          oldValue: newProps.value
        });
      }
    }

    initOnChange(e) {
      const {type, isInputPending, onStartPending, onChange} = this.props;
      const value = isBoolHtmlInputType(type)
        ? e.target.checked
        : e.target.value;
      const valueTypeGuard = valueTypesGuards[type];

      if (valueTypeGuard && !valueTypeGuard(value)) {
        return;
      }

      this.setState({
        value
      });

      const valueChangeGuard = valueChangeGuards[type];

      if (valueChangeGuard && !valueChangeGuard(value, this.state.oldValue)) {
        return;
      }

      const normalizer = valuesNormalizer[type];
      const normalizedValue = normalizer
        ? normalizer(value, this.props.initialValue)
        : value;

      this.setState({
        oldValue: normalizedValue
      });

      if (!onChange) {
        return;
      }

      if (!isInputPending && onStartPending) {
        onStartPending();
      }

      this.onChange(normalizedValue);
    }

    setOnChangeMethod() {
      const inputDebounce = typeof this.props.debounce === 'number'
        ? this.props.debounce
        : isBoolHtmlInputType(this.props.type)
          ? defaultBoolDebounce
          : typeof this.context.inputDebounce === 'number'
            ? this.context.inputDebounce
            : defaultDebounce;

      this.onChange = inputDebounce === 0
        ? this.props.onChange
        : debounce(this.props.onChange, inputDebounce);
    }

    render() {
      const {errors, type, required, placeholder, className, onBlur, readOnly,
        disabled, autoFocus, inputClassName, inputProps} = this.props;
      const value = isVal(this.state.value)
        ? this.state.value
        : '';
      const hasErrors = !!errors && !!errors.length;

      return React.DOM.span({
          className: `crizmas-input ${hasErrors ? 'has-errors' : ''} ${className}`
        },
        !!required && React.DOM.span(null, '*'),
        React.DOM[type === 'textarea' ? type : 'input'](Object.assign(
          {},
          inputProps,
          {
            value,
            checked: isBoolHtmlInputType(type) && value,
            type: allowedHtmlInputTypes.includes(type)
              ? type
              : 'text',
            placeholder,
            onChange: this.initOnChange,
            onBlur,
            readOnly,
            disabled,
            autoFocus,
            className: inputClassName,
          }
        )),
        hasErrors && React.DOM.span(null,
          errors.map((error, i) => React.DOM.span({key: i}, error))
        )
      );
    }
  }

  Input.propTypes = {
    value: PropTypes.any,
    initialValue: PropTypes.any,
    type: PropTypes.oneOf([...allowedHtmlInputTypes, 'string', 'number','integer', 'textarea']),
    errors: PropTypes.array,
    isInputPending: PropTypes.bool,
    required: PropTypes.bool,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    inputClassName: PropTypes.string,
    debounce: PropTypes.number,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onStartPending: PropTypes.func,
    readOnly: PropTypes.bool,
    disabled: PropTypes.bool,
    autoFocus: PropTypes.bool,
    inputProps: PropTypes.object
  };

  Input.defaultProps = {
    type: 'text',
    className: ''
  };

  Input.contextTypes = {
    inputDebounce: PropTypes.number
  };

  const moduleExports = Input;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas.Input = moduleExports;
  }
})();
