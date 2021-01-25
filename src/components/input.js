import React from 'react';
import propTypes from 'prop-types';
import {isVal} from 'crizmas-mvc';

import {debounce} from '../utils.js';

const {createElement} = React;

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

export default class Input extends React.Component {
  constructor(...args) {
    super(...args);

    this.state = {
      value: this.props.value,
      // last normalized value
      oldValue: this.props.value
    };

    this.onChange = null;
    this.onBlur = null;
    this.initOnChange = this.initOnChange.bind(this);

    this.setOnChangeMethod();
    this.setOnBlurMethod();
  }

  componentDidUpdate(prevProps) {
    const debounceChanged = this.props.debounce !== prevProps.debounce;
    let onChangeChanged;
    let onBlurChanged;

    if (debounceChanged || this.props.onChange !== prevProps.onChange) {
      this.setOnChangeMethod();

      onChangeChanged = true;
    }

    if (debounceChanged || this.props.onBlur !== prevProps.onBlur) {
      this.setOnBlurMethod();

      onBlurChanged = true;
    }

    // we must ignore the same value when we have an intermediary string representation
    // like 3.20 (after the 0 there can be a new decimal)
    if (!this.props.isInputPending && this.props.value !== this.state.oldValue) {
      this.setState({
        value: this.props.value,
        oldValue: this.props.value
      });
    } else if (onChangeChanged || onBlurChanged) {
      this.forceUpdate();
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
    const inputDebounce = this.getInputDebounce();

    this.onChange = inputDebounce === 0
      ? this.props.onChange
      : debounce(this.props.onChange, inputDebounce);
  }

  getInputDebounce() {
    return typeof this.props.debounce === 'number'
      ? this.props.debounce
      : isBoolHtmlInputType(this.props.type)
        ? defaultBoolDebounce
        : typeof this.context.inputDebounce === 'number'
          ? this.context.inputDebounce
          : defaultDebounce;
  }

  setOnBlurMethod() {
    if (!this.props.onBlur) {
      return void (this.onBlur = null);
    }

    const inputDebounce = this.getInputDebounce();

    this.onBlur = inputDebounce === 0
      ? this.props.onBlur
      : debounce(this.props.onBlur, inputDebounce);
  }

  render() {
    const {errors, type, required, placeholder, className, readOnly,
      disabled, autoFocus, inputClassName, inputProps} = this.props;
    const value = isVal(this.state.value)
      ? this.state.value
      : '';
    const hasErrors = !!errors && !!errors.length;

    return createElement(
      'span',
      {
        className: `crizmas-input ${hasErrors ? 'has-errors' : ''} ${className}`
      },
      !!required && createElement('span', null, '*'),
      createElement(
        type === 'textarea' ? type : 'input',
        Object.assign(
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
            onBlur: this.onBlur,
            readOnly,
            disabled,
            autoFocus,
            className: inputClassName
          })),
      hasErrors && createElement(
        'span',
        null,
        errors.map((error, i) => createElement('span', {key: i}, error))));
  }
}

Input.propTypes = {
  value: propTypes.any,
  initialValue: propTypes.any,
  type: propTypes.oneOf([...allowedHtmlInputTypes, 'string', 'number', 'integer', 'textarea']),
  errors: propTypes.array,
  isInputPending: propTypes.bool,
  required: propTypes.bool,
  placeholder: propTypes.string,
  className: propTypes.string,
  inputClassName: propTypes.string,
  debounce: propTypes.number,
  onChange: propTypes.func,
  onBlur: propTypes.func,
  onStartPending: propTypes.func,
  readOnly: propTypes.bool,
  disabled: propTypes.bool,
  autoFocus: propTypes.bool,
  inputProps: propTypes.object
};

Input.defaultProps = {
  type: 'text',
  className: ''
};

Input.contextTypes = {
  inputDebounce: propTypes.number
};
