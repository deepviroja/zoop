const fs = require('fs');

const file = 'd:/Zoop/zoop/src/pages/customer/Home.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `<div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-5">`;
const replacementStr = `<div className="hidden md:grid bento-grid mt-4">`;

content = content.replace(targetStr, replacementStr);

const classTarget = `className="group h-72 rounded-2xl overflow-hidden border border-white/10 glass-card shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-zoop-moss"`;
// Note: shadow-xl might have been replaced to shadow-[...] so I will use a more generic regex for the className if it doesn't match exactly.
const genericTargetRegex = /className="group h-72 rounded-2xl overflow-hidden border border-white\/10 glass-card[^"]+"/g;

const replacementClass = `className={\`group \${idx === 0 ? 'col-span-12 md:col-span-8 md:row-span-2 min-h-[440px]' : idx === 1 || idx === 2 ? 'col-span-12 md:col-span-4 min-h-[210px]' : 'col-span-12 md:col-span-4 min-h-[280px]'} rounded-[24px] overflow-hidden border border-white/10 glass-card shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-zoop-moss bento-item\`}`;

content = content.replace(genericTargetRegex, replacementClass);

fs.writeFileSync(file, content);
console.log('Bento grid applied to Home.jsx');
