const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (name.endsWith('.jsx') || name.endsWith('.js')) {
      files.push(name);
    }
  }
  return files;
}

const allFiles = getFiles(path.join(__dirname, 'src'));
const tables = new Set();
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/supabase\.from\(['"](.*?)['"]\)/g)];
  for (const m of matches) {
    tables.add(m[1]);
  }
}

console.log('TABLES:', Array.from(tables).join(', '));
