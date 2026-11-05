const crypto = require('crypto');

// bỏ các ký tự dễ nhầm: 0/O, 1/I
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateReferenceCode() {
  const d = new Date();
  const date =
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');

  const bytes = crypto.randomBytes(8);
  let random = '';
  for (const b of bytes) {
    random += CHARS[b % CHARS.length];
  }

  return `PP${date}${random}`;
}

module.exports = { generateReferenceCode };