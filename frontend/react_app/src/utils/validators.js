export const required = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Trường này là bắt buộc';
  }
  return null;
};

export const email = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (value && !emailRegex.test(value)) {
    return 'Email không hợp lệ';
  }
  return null;
};

export const minLength = (min) => (value) => {
  if (value && value.length < min) {
    return `Độ dài tối thiểu là ${min} ký tự`;
  }
  return null;
};
