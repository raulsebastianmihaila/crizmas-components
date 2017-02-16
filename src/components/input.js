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
    funcUtils = window.crizmas.funcUtils;
  }

  const {Component, PropTypes} = React;
  const {debounce} = funcUtils;

  const defaultDebounce = 100;
  const defaultBoolDebounce = 0;
  const numberRegExp = /^(-|\+)?(((\d+(\.\d*)?)|(\.\d+))(e(-|\+)?\d+)?)$/i;
  const partialNumberRegExp =
    /^(-|\+)?((\d*(\.\d*)?)|((((\d+(\.\d*)?)|(\.\d+))(e(-|\+)?\d*)?)?))$/i;
  const integerRegExp = /^(-|\+)?\d+$/i;
  const partialIntegerRegExp = /^(-|\+)?\d*$/i;

  // other than text type
  const isAllowedHtmlInputType = (type) => type === 'radio' || type === 'checkbox';

  const isBoolHtmlInputType = (type) => type === 'radio' || type === 'checkbox';

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
    finiteNumber: (value) => {
      const number = Number(value);

      return Number.isNaN(number) || Number.isFinite(number);
    },

    number: (value) => {
      return partialNumberRegExp.test(value) && valueTypesGuards.finiteNumber(value);
    },

    integer: (value) => {
      return partialIntegerRegExp.test(value) && valueTypesGuards.finiteNumber(value);
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

      // isMounted will be deprecated in React
      // https://facebook.github.io/react/blog/2015/12/16/ismounted-antipattern.html
      this.mounted = false;

      this.state = {
        value: this.props.value,
        oldValue: this.props.value
      };

      this.initOnChange = this.initOnChange.bind(this);

      this.setOnChangeMethod();
    }

    componentWillMount() {
      this.mounted = true;
    }

    componentWillUnmount() {
      this.mounted = false;
    }

    componentWillReceiveProps(newProps) {
      if (newProps.debounce !== this.props.debounce) {
        this.setOnChangeMethod();
      }

      // we must ignore the same value when we have an intermediary string representation
      // like 3.20 (after the 0 there can be a new decimal)
      if (!newProps.isInputPending && newProps.value !== this.props.value) {
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
      const valueChangeGuard = valueChangeGuards[type];

      if (valueTypeGuard && !valueTypeGuard(value)) {
        return;
      }

      this.setState({
        value
      });

      if (!onChange || (valueChangeGuard && !valueChangeGuard(value, this.state.oldValue))) {
        return;
      }

      if (!isInputPending && onStartPending) {
        onStartPending();
      }

      this.onChange(value);
    }

    onChange(value) {
      const {type, onChange} = this.props;

      const normalizer = valuesNormalizer[type];
      const newValue = normalizer
        ? normalizer(value, this.props.initialValue)
        : value;

      // since onChange could be debounced we should check if the component is still mounted
      if (this.mounted) {
        this.setState({oldValue: newValue});
      }

      onChange(newValue);
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
        ? Input.prototype.onChange
        : debounce(Input.prototype.onChange, inputDebounce);
    }

    render() {
      const {errors, type, required, placeholder, className, onBlur, readOnly,
        disabled, autoFocus} = this.props;
      let value = this.state.value;

      value = value === null || value === undefined
        ? ''
        : value;

      return React.DOM.span({className},
        !!required && React.DOM.span(null, '*'),
        React.DOM.input({
            value,
            checked: isBoolHtmlInputType(type) && value,
            type: isAllowedHtmlInputType(type)
              ? type
              : 'text',
            placeholder,
            onChange: this.initOnChange,
            onBlur,
            readOnly,
            disabled,
            autoFocus
          }
        ),
        !!errors && !!errors.length && React.DOM.span(null,
          errors.map((error, i) => React.DOM.span({key: i}, error))
        )
      );
    }
  }

  Input.propTypes = {
    value: PropTypes.any,
    initialValue: PropTypes.any,
    type: PropTypes.oneOf(['string', 'text', 'number', 'integer', 'checkbox', 'radio']),
    errors: PropTypes.array,
    isInputPending: PropTypes.bool,
    required: PropTypes.bool,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    debounce: PropTypes.number,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onStartPending: PropTypes.func,
    readOnly: PropTypes.bool,
    disabled: PropTypes.bool,
    autoFocus: PropTypes.bool
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
    window.crizmas.Input = moduleExports;
  }
})();
