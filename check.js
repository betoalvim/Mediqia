const fs = require('fs');
const appjs = fs.readFileSync('app.js', 'utf8');
const match = appjs.match(/document\.getElementById\(['"]([^'"]+)['"]\)/g);
if (match) {
  const ids = [...new Set(match.map(s => s.match(/['"]([^'"]+)['"]/)[1]))];
  const html = fs.readFileSync('index.html', 'utf8');
  const missing = ids.filter(id => !html.includes('id="' + id + '"') && !html.includes("id='" + id + "'"));
  console.log('Missing IDs:', missing);
} else {
  console.log('No matches');
}
