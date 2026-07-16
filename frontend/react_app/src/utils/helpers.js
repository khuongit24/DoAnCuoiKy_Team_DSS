export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};
