(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

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

  const throttle = (func, delay) => {
    let timeout;

    // make sure the function is not a constructor
    return ({
      function(...args) {
        if (!timeout) {
          timeout = setTimeout(() => {
            timeout = null;

            func.apply(this, args);
          }, delay);
        }
      }
    }).function;
  };

  const moduleExports = {
    debounce,
    throttle
  };

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas = window.crizmas || {};
    window.crizmas.funcUtils = moduleExports;
  }
})();
