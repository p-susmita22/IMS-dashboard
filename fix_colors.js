const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/parid/OneDrive/Desktop/IMS/frontend/src';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add missing dark mode for standard tailwind colors
  const colorRegex = /\b(text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(950|900|800|700|600|500))\b(?!\s*dark:text-)/g;
  
  content = content.replace(colorRegex, (match, fullClass, color, weight) => {
    let newWeight = '400';
    if (weight === '950') newWeight = '300';
    if (weight === '900') newWeight = '300';
    if (weight === '800') newWeight = '300';
    if (weight === '700') newWeight = '400';
    if (weight === '600') newWeight = '400';
    if (weight === '500') newWeight = '400';
    
    if (['slate', 'gray', 'zinc', 'neutral', 'stone'].includes(color)) {
       if (weight === '950') newWeight = '100';
       if (weight === '900') newWeight = '200';
       if (weight === '800') newWeight = '300';
       if (weight === '700') newWeight = '300';
       if (weight === '600') newWeight = '400';
       if (weight === '500') newWeight = '400';
    }

    return `${fullClass} dark:text-${color}-${newWeight}`;
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
console.log('Text color fix completed.');
