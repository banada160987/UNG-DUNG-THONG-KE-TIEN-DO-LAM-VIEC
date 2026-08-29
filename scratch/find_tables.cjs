const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const dirFiles = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  dirFiles.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(srcDir);
const results = {};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Simple regex to find supabase.from('table').insert([{ col: val }])
  // We'll just look for supabase.from('...')
  
  const fromRegex = /supabase\.from\(['"`](.*?)['"`]\)/g;
  let match;
  while ((match = fromRegex.exec(content)) !== null) {
    const table = match[1];
    if (!results[table]) {
      results[table] = new Set();
    }
    results[table].add(file);
  }
});

console.log("Tables accessed:");
for (const table in results) {
  console.log(`- ${table}:`);
  for (const file of results[table]) {
    console.log(`  - ${file}`);
  }
}
