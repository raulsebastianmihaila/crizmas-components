(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let fitContentValue;

  const debounce = (func, delay) => {
    let timeout;

    // make sure the function is not a constructor
    return ({
      function(...args) {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
          func.apply(this, args);
        }, delay);
      }
    }).function;
  };

  const getFitContentValue = () => {
    if (!fitContentValue) {
      fitContentValue = detectFitContentValue();
    }

    return fitContentValue;
  };

  const detectFitContentValue = () => {
    const div = document.createElement('div');

    div.style.width = 'fit-content';

    if (div.style.width === 'fit-content') {
      return 'fit-content';
    }

    return '-moz-fit-content';
  };

  const moduleExports = {
    debounce,
    getFitContentValue
  };

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas = window.crizmas || {};
    window.crizmas.componentUtils = moduleExports;
  }
})();
