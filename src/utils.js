let fitContentValue;
let stickyValue;

export const debounce = (func, delay) => {
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

export const getFitContentValue = () => {
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

export const getStickyValue = () => {
  if (!stickyValue) {
    stickyValue = detectStickyValue();
  }

  return stickyValue;
};

const detectStickyValue = () => {
  const div = document.createElement('div');

  div.style.position = 'sticky';

  if (div.style.position === 'sticky') {
    return 'sticky';
  }

  // Safari requires the prefix
  return '-webkit-sticky';
};
