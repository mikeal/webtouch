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

// touch a .js file that has html source in it.
// For the test to pass, webtouch needs to ignore links found in js files.
var source = "var a = 'foo', b = '<img src=\"http://' + a + '.com/someimage.png\">'"
ok.expect(1)

http.createServer(function (req, resp) {
  resp.statusCode = 200
  if (req.url === '/js.js') {
    resp.setHeader('content-type', 'text/javascript')
    resp.end(source)
  }
  resp.statusCode = 404
  resp.end()
}).listen(8080, function () {
  webtouch('http://localhost:8080/js.js', function (e, urls) {
    if (e) throw e
    assert.equal(urls.length, 1)
    ok('no links followed in js')
    d.cleanup()
  });
});

