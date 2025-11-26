// Generate a numeric-only voucher code (default 5 digits)
export const generateVoucherCode = (length = 5) => {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};
