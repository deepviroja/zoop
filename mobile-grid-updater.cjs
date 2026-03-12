const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      // Change list grids to mobile 2-columns
      content = content.replace(/grid-cols-1 sm:grid-cols-2/g, 'grid-cols-2 sm:grid-cols-2');
      
      // Update padding/gap for mobile to look tighter
      content = content.replace(/gap-4 md:gap-6/g, 'gap-2 md:gap-6');
      content = content.replace(/gap-6 md:gap-8/g, 'gap-3 md:gap-8');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated grid in', fullPath);
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'src', 'pages'));
replaceInDir(path.join(__dirname, 'src', 'components'));
console.log('Grid update complete!');
