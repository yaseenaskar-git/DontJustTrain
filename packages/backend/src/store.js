const fs = require('fs');
const path = require('path');

function filePath(name) {
  return path.join(__dirname, '..', 'data', name + '.json');
}

function ensureDir() {
  const dir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

function read(name) {
  ensureDir();
  const p = filePath(name);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return {};
  }
}

function write(name, data) {
  ensureDir();
  const p = filePath(name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

module.exports = { read, write };
