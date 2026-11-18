const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 8080;
const ROOT = __dirname;
const MIME = {
  '.html':'text/html; charset=utf-8',
  '.js':'application/javascript',
  '.json':'application/json',
  '.css':'text/css',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.ico':'image/x-icon',
};
http.createServer((req,res)=>{
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  const file = path.join(ROOT, url);
  fs.readFile(file, (err,data)=>{
    if (err) { res.statusCode=404; res.end('Not found'); return; }
    const ext = path.extname(file);
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.end(data);
  });
}).listen(PORT, ()=>console.log('Admin panel: http://localhost:'+PORT));
"