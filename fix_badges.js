const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/parid/OneDrive/Desktop/IMS/frontend/src';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Fix the broken /50
  content = content.replace(/bg-slate-50 \/50/g, 'bg-slate-50 dark:bg-slate-800/50');
  content = content.replace(/dark:hover:bg-slate-700\/50 \/50/g, 'dark:hover:bg-slate-700/50');

  // 2. Add dark backgrounds to light colored badges
  // Matches bg-[color]-50 or bg-[color]-100 where color is not slate/gray/white
  const badgeRegex = /\b(bg-(emerald|amber|rose|purple|indigo|blue|red|green|yellow)-(50|100))\b(?!\s*dark:bg-)/g;
  content = content.replace(badgeRegex, (match, fullClass, color) => {
    return `${fullClass} dark:bg-${color}-900/50`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      processDirectory(itemPath);
    } else if (itemPath.endsWith('.jsx')) {
      processFile(itemPath);
    }
  }
}

processDirectory(directory);
console.log('Fixed broken classes and badges.');
