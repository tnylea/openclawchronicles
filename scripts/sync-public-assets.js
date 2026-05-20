#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const copies = [
  {
    from: path.join(root, 'assets', 'js'),
    to: path.join(root, 'public', 'assets', 'js'),
  },
  {
    from: path.join(root, 'assets', 'images'),
    to: path.join(root, 'public', 'assets', 'images'),
  },
];

for (const { from, to } of copies) {
  if (!fs.existsSync(from)) continue;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`Synced ${path.relative(root, from)} -> ${path.relative(root, to)}`);
}
