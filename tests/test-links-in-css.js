var webtouch = require('../')
, ok = require('okdone')
, cleanup = require('cleanup')
, http = require('http')
, assert = require('assert')
;

var d = cleanup(function (error) {
  if (error) process.exit(1)
  ok.done()
  process.exit()
})

var css = ""+
  "@font-face {"+
  "  font-family: 'touchy';"+
  "  src: url('f.eot') format('embedded-opentype'),"+
  "       url('f.woff') format('woff'),"+
  "       url('f.ttf') format('truetype'),"+
  "       url('f.svg') format('svg');"+
  "}"
;

ok.expect(1)

http.createServer(function (req, resp) {
  resp.statusCode = 200
  var fonts = {
    '/f.eot': 'application/vnd.ms-fontobject',
    '/f.woff': 'application/font-woff',
    '/f.ttf': 'application/x-font-ttf',
    '/f.svg': 'image/svg+xml'
  };
  if (req.url === '/css') {
    resp.setHeader('content-type', 'text/css')
    resp.end(css)
  }
  if (fonts[req.url]) {
    resp.setHeader('content-type', fonts[req.url])
    resp.end()
  }
  resp.statusCode = 404
  resp.end()
}).listen(8080, function () {
  webtouch('http://localhost:8080/css', function (e, urls) {
    if (e) throw e
    assert.equal(urls.length, 5)
    ok('multi css link ok')
    d.cleanup()
  });
});

