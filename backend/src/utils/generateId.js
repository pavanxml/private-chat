const crypto = require('crypto');

const UPPER_ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing chars (0/O, 1/I)
const LOWER_ALPHANUMERIC = 'abcdefghijkmnpqrstuvwxyz23456789';

function randomFromAlphabet(alphabet, length) {
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i += 1) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return result;
}

/** Generates a room code like "ABCD123" (7 chars, uppercase alphanumeric). */
function generateRoomCode(length = 7) {
  return randomFromAlphabet(UPPER_ALPHANUMERIC, length);
}

/** Generates a temporary username like "guest7f3k2q". */
function generateUsername(prefix = 'guest') {
  return `${prefix}${randomFromAlphabet(LOWER_ALPHANUMERIC, 6)}`;
}

/** Generates a temporary password, e.g. "k3n9pQ2x". */
function generatePassword(length = 10) {
  const alphabet = LOWER_ALPHANUMERIC + LOWER_ALPHANUMERIC.toUpperCase() + '23456789';
  return randomFromAlphabet(alphabet, length);
}

module.exports = { generateRoomCode, generateUsername, generatePassword };
