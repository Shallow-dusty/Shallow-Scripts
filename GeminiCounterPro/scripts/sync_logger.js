const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'lib', 'debug_logger.js');
const dest = path.join(__dirname, '..', 'GeminiCounter_Ultimate.user.js');

const content = fs.readFileSync(src, 'utf8')
  .replace(/"use strict";\s*/g, '')
  .replace(/module\.exports\s*=\s*\{[^}]*\};?\s*/g, '');

const file = fs.readFileSync(dest, 'utf8');
const start = '// <LOGGER_MODULE>';
const end = '// </LOGGER_MODULE>';
const startIdx = file.indexOf(start);
const endIdx = file.indexOf(end);
if (startIdx === -1 || endIdx === -1) {
  throw new Error('Logger markers not found in userscript');
}
const before = file.slice(0, startIdx + start.length);
const after = file.slice(endIdx);
const injected = `${before}\n${content}\n${after}`;
fs.writeFileSync(dest, injected, 'utf8');
console.log('Logger module synced.');
