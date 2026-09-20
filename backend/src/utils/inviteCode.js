const crypto = require('crypto');

// Human-friendly alphabet omitting easily confusable characters (0, O, 1, I, L)
const CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generates an 8-character household invite code (e.g. BF-K8M2P4).
 */
function generateInviteCode() {
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[bytes[i] % CHARS.length];
  }
  return `BF-${code}`;
}

module.exports = {
  generateInviteCode
};
