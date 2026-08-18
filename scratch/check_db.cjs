const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const sqlDir = path.join(__dirname, '..');

function getAllFiles(dirPath, ext, arrayOfFiles) {
  try {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function(file) {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, ext, arrayOfFiles);
      } else {
        if (file.endsWith(ext) || (ext === '.jsx' && file.endsWith('.js'))) {
          arrayOfFiles.push(path.join(dirPath, "/", file));
        }
      }
    });
  } catch (e) {}
  return arrayOfFiles;
}

const jsFiles = getAllFiles(srcDir, '.jsx');

// Extract table schemas
const sqlFiles = getAllFiles(sqlDir, '.sql');
const schemas = {};

sqlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // very basic CREATE TABLE parser
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const columnsStr = match[2];
    const columns = [];
    const colLines = columnsStr.split('\n');
    colLines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('--') && !line.startsWith('CONSTRAINT') && !line.startsWith('PRIMARY KEY') && !line.startsWith('FOREIGN KEY')) {
        const colNameMatch = line.match(/^([a-zA-Z0-9_]+)\s+/);
        if (colNameMatch) {
          columns.push(colNameMatch[1]);
        }
      }
    });
    schemas[tableName] = columns;
  }
});

const usedColumns = {};

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find supabase.from('table').insert([{ col: val, col2: val2 }])
  const insertRegex = /supabase\.from\(['"`](.*?)['"`]\)\.insert\(\[\s*\{([\s\S]*?)\}\s*\]\)/g;
  let match;
  while ((match = insertRegex.exec(content)) !== null) {
    const table = match[1];
    const payloadStr = match[2];
    if (!usedColumns[table]) usedColumns[table] = { insert: new Set(), update: new Set() };
    
    // Find keys in payload. Rough regex.
    const keyRegex = /([a-zA-Z0-9_]+)\s*:/g;
    let kMatch;
    while ((kMatch = keyRegex.exec(payloadStr)) !== null) {
      usedColumns[table].insert.add(kMatch[1]);
    }
  }

  // Find update
  const updateRegex = /supabase\.from\(['"`](.*?)['"`]\)\.update\(\{\s*([\s\S]*?)\}\s*\)/g;
  while ((match = updateRegex.exec(content)) !== null) {
    const table = match[1];
    const payloadStr = match[2];
    if (!usedColumns[table]) usedColumns[table] = { insert: new Set(), update: new Set() };
    
    const keyRegex = /([a-zA-Z0-9_]+)\s*:/g;
    let kMatch;
    while ((kMatch = keyRegex.exec(payloadStr)) !== null) {
      usedColumns[table].update.add(kMatch[1]);
    }
  }
});

console.log("Analysis Results:");
for (const table in usedColumns) {
  console.log(`\nTable: ${table}`);
  const schemaCols = schemas[table] || [];
  if (schemaCols.length === 0) {
    console.log(`  [WARNING] Schema for table ${table} not found in .sql files.`);
  } else {
    console.log(`  Schema Columns: ${schemaCols.join(', ')}`);
  }
  
  const insertCols = Array.from(usedColumns[table].insert);
  const updateCols = Array.from(usedColumns[table].update);
  
  const allUsed = new Set([...insertCols, ...updateCols]);
  const missing = [];
  allUsed.forEach(col => {
    if (schemaCols.length > 0 && !schemaCols.includes(col)) {
      missing.push(col);
    }
  });

  console.log(`  Used in INSERT: ${insertCols.join(', ')}`);
  console.log(`  Used in UPDATE: ${updateCols.join(', ')}`);
  
  if (missing.length > 0) {
    console.log(`  [ERROR] Columns missing from schema: ${missing.join(', ')}`);
  } else {
    console.log(`  [OK] All used columns seem to exist in schema.`);
  }
}
