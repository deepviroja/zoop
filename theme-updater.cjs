const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  ['bg-white', 'glass-card'],
  ['text-zoop-obsidian', 'text-white'],
  ['text-gray-800', 'text-gray-100'],
  ['text-gray-900', 'text-white'],
  ['text-gray-700', 'text-gray-300'],
  ['text-gray-600', 'text-gray-400'],
  ['bg-gray-50', 'bg-white/5'],
  ['bg-gray-100', 'bg-white/10'],
  ['bg-gray-200', 'bg-white/20'],
  ['border-gray-100', 'border-white/10'],
  ['border-gray-200', 'border-white/10'],
  ['border-[#e7dfd4]', 'border-white/10'],
  ['shadow-sm', 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]'],
  ['shadow-md', 'shadow-[0_8px_24px_rgba(0,0,0,0.5)]'],
  ['shadow-lg', 'shadow-[0_12px_32px_rgba(0,0,0,0.5)]'],
  ['shadow-xl', 'shadow-[0_16px_48px_rgba(0,0,0,0.5)]'],
  ['shadow-2xl', 'shadow-[0_24px_64px_rgba(0,0,0,0.5)]'],
  ['bg-[#fcfaf7]', 'bg-zoop-ink'],
  ['bg-[#f4efe6]', 'bg-white/5'],
  ['aspect-square', 'aspect-4-5'],
];

function processFile(filePath) {
  if (filePath.endsWith('.css') || filePath.endsWith('.svg') || filePath.endsWith('.png')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (let [oldClass, newClass] of replacements) {
    // Only replace when surrounded by space, quote, or backtick.
    const regex = new RegExp(`(?<=[\\'\\"\\s\`])` + oldClass.replace(/\[/g, '\\[').replace(/\]/g, '\\]') + `(?=[\\'\\"\\s\`])`, 'g');
    content = content.replace(regex, newClass);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

processDirectory(directoryPath);
console.log('Complete!');
