/* Add to end of index.css */
const fs = require('fs');
const cssFile = 'd:/Zoop/zoop/src/index.css';
let cb = fs.readFileSync(cssFile, 'utf8');
if (!cb.includes('.theme-light')) {
  const lightStyles = `
/* Light Theme Mode Overrides */
.theme-light {
  background-color: #fbf9f7 !important;
  color: #1a1a1a !important;
}

.theme-light::after {
  opacity: 0.015;
  mix-blend-mode: multiply;
}

.theme-light .glass-card {
  background: rgba(255, 255, 255, 0.9) !important;
  border-color: rgba(0, 0, 0, 0.06) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
}
.theme-light .glass-card:hover {  
  border-color: rgba(0, 0, 0, 0.12) !important;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08) !important;
}
.theme-light .glass {
  background: rgba(255, 255, 255, 0.8) !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
}

.theme-light .text-white,
.theme-light .text-gray-100,
.theme-light .text-gray-200,
.theme-light .text-gray-300 {
  color: #1a1a1a !important;
}
.theme-light .text-gray-400,
.theme-light .text-gray-500 {
  color: #4b5563 !important; 
}
.theme-light .bg-zoop-ink {
  background-color: #f4efe6 !important;
}
.theme-light .bg-white\\/5,
.theme-light .bg-white\\/10,
.theme-light .bg-white\\/20 {
  background-color: rgba(0,0,0,0.03) !important;
}
.theme-light .border-white\\/10,
.theme-light .border-white\\/20,
.theme-light .border-white\\/60 {
  border-color: rgba(0,0,0,0.08) !important;
}

.theme-light button.bg-zoop-obsidian .text-white,
.theme-light button.bg-red-500 .text-white,
.theme-light button.bg-black .text-white,
.theme-light .bg-zoop-obsidian .text-white,
.theme-light .bg-zoop-obsidian h1,
.theme-light .bg-zoop-obsidian h2,
.theme-light .bg-zoop-obsidian h3,
.theme-light .bg-zoop-obsidian h4, 
.theme-light .bg-zoop-obsidian p {
  color: #ffffff !important;
}

.theme-light .bg-gradient-to-t .text-white,
.theme-light .absolute.inset-0.bg-gradient-to-t ~ .absolute .text-white,
.theme-light .absolute.inset-0.bg-gradient-to-t ~ .absolute h1,
.theme-light .absolute.inset-0.bg-gradient-to-t ~ .absolute h3,
.theme-light .absolute.inset-0.bg-gradient-to-t ~ .absolute p {
  color: #ffffff !important;
}
`;
  fs.writeFileSync(cssFile, cb + '\\n' + lightStyles);
  console.log('Appended light styles');
}
