import jsonStringifySafe from 'json-stringify-safe';

const UNSAFE_CHARS_REGEXP = /[<>/\u2028\u2029]/g;
const ESCAPED_CHARS = {
  '<': '\\u003C',
  '>': '\\u003E',
  '/': '\\u002F',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

export default function stringify(obj) {
  return `${jsonStringifySafe(obj)}`
  .replace(UNSAFE_CHARS_REGEXP, c => ESCAPED_CHARS[c]);
}
