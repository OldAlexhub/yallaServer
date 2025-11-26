const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateReferralCode = () => {
  let code = "";
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * CHARS.length);
    code += CHARS[idx];
  }
  return code;
};

export default { generateReferralCode };
