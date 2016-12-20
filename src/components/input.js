(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let React;
  let funcUtils;

  if (isModule) {
    React = require('react');
    funcUtils = require('../utils');
  } else {
    React = window.React;
    funcUtils = window.crizmasFuncUtils;
  }

  const {Component, PropTypes} = React;
  const {debounce} = funcUtils;

  const defaultDebounce = 100;
  // other than text type
  const allowedHtmlInputTypes = ['radio', 'checkbox'];
  const numberRegExp = /^(-|\+)?(((\d+(\.\d*)?)|(\.\d+))(e(-|\+)?\d+)?)$/i;
  const partialNumberRegExp =
    /^(-|\+)?((\d*(\.\d*)?)|((((\d+(\.\d*)?)|(\.\d+))(e(-|\+)?\d*)?)?))$/i;
  const integerRegExp = /^(-|\+)?\d+$/i;
  const partialIntegerRegExp = /^(-|\+)?\d*$/i;

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

    text: (value) => valuesNormalizer.string(value)
  };

  const valueTypesGuards = {
    number: (value) => {
      return partialNumberRegExp.test(value);
    },

    integer: (value) => {
      return partialIntegerRegExp.test(value);
    }
  };

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

    text: (value, oldValue) => valueChangeGuards.string(value, oldValue)
  };

  class Input extends Component {
    constructor(...args) {
      super(...args);

      this.state = {
        value: this.props.value,
        oldValue: this.props.value
      };

      const inputDebounce = typeof this.props.debounce === 'number'
        ? this.props.debounce
        : typeof this.context.inputDebounce === 'number'
          ? this.context.inputDebounce
          : defaultDebounce;

      this.initOnChange = this.initOnChange.bind(this);
      this.onChange = inputDebounce === 0
        ? this.onChange
        : debounce(this.onChange, inputDebounce);
    }

    componentWillReceiveProps(newProps) {
      if (newProps.value !== this.props.value) {
        this.setState({
          value: newProps.value,
          oldValue: newProps.value
        });
      }
    }

    initOnChange(e) {
      const {type, isInputPending, onStartPending, onChange} = this.props;
      const value = e.target.value;
      const valueTypeGuard = valueTypesGuards[type];

      if (valueTypeGuard && !valueTypeGuard(value)) {
        return;
      }

      this.setState({
        value
      });

      if (!onChange) {
        return;
      }

      if (!isInputPending && onStartPending) {
        onStartPending();
      }

      this.onChange(value);
    }

    onChange(value) {
      const {type, onChange} = this.props;
      const valueChangeGuard = valueChangeGuards[type];

      if (valueChangeGuard && !valueChangeGuard(value, this.state.oldValue)) {
        return;
      }

      const normalizer = valuesNormalizer[type];
      const newValue = normalizer
        ? normalizer(value, this.props.initialValue)
        : value;

      this.setState({oldValue: newValue});
      onChange(newValue);
    }

    render() {
      const {errors, type, isPending, required, placeholder, className, onBlur} = this.props;
      let value = this.state.value;

      value = value === null || value === undefined
        ? ''
        : value;

      return React.DOM.span(
        {className},
        !!required && React.DOM.span(
          null,
          '*'
        ),
        React.DOM.input(
          {
            value,
            type: allowedHtmlInputTypes.includes(type)
              ? type
              : 'text',
            placeholder: placeholder,
            readOnly: isPending,
            onChange: this.initOnChange,
            onBlur
          }
        ),
        !!errors && !!errors.length && React.DOM.span(
          null,
          errors.map((error, i) => React.DOM.span(
            {key: i},
            error
          ))
        )
      );
    }
  }

  Input.propTypes = {
    value: PropTypes.any,
    initialValue: PropTypes.any,
    type: PropTypes.oneOf(['string', 'text', 'number', 'integer', 'checkbox', 'radio']),
    errors: PropTypes.array,
    isPending: PropTypes.bool,
    isInputPending: PropTypes.bool,
    required: PropTypes.bool,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    debounce: PropTypes.number,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onStartPending: PropTypes.func
  };

  Input.defaultProps = {
    type: 'string'
  };

  Input.contextTypes = {
    inputDebounce: PropTypes.number
  };

  const moduleExports = Input;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.CrizmasInput = moduleExports;
  }
})();
