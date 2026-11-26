var fs = require('fs');
var path = require('path');

var source = path.resolve(__dirname, '../frontend_custom_app/public/frontend/index.html');
var target = path.resolve(__dirname, '../frontend_custom_app/www/student-portal.html');
var html = fs.readFileSync(source, 'utf8');
var csrfLine = '  <script> window.csrf_token = \'{{ csrf_token }}\'; </script>\n';
var marker = '</body>';
var at = html.indexOf(marker);

if (at < 0) {
  throw new Error('Body marker not found in built index.html');
}

html = html.slice(0, at) + csrfLine + html.slice(at);
fs.writeFileSync(target, html);
