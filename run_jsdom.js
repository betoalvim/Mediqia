const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const appjs = fs.readFileSync('app.js', 'utf8');
const dbjs = fs.readFileSync('database.js', 'utf8');

const dom = new JSDOM(html, {
  url: "http://localhost/",
  runScripts: "dangerously",
  resources: "usable"
});

try {
  dom.window.eval(dbjs + "\n" + appjs);
} catch(e) {
  console.error("EVAL ERROR:", e.stack);
}

try {
  // trigger DOMContentLoaded
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  if (dom.window.app) {
    console.log('init successful');
  } else {
    console.error('INIT ERROR: app not initialized on window');
  }
} catch(e) {
  console.error('GLOBAL ERROR:', e.stack);
}
