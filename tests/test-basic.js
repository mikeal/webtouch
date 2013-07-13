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

var html = '<html><body><script src="/js.js"></script><img src="/img.png"></img></body></html>'

ok.expect(9)

http.createServer(function (req, resp) {
  resp.statusCode = 200
  if (req.url === '/index.html') {
    resp.setHeader('content-type', 'text/html')
    resp.end(html)
  }
  if (req.url === '/js.js') {
    resp.setHeader('content-type', 'text/javascript')
    resp.end(html)
  }
  if (req.url === '/img.png') {
    resp.setHeader('content-type', 'image/png')
    resp.end(html)
  }
  if (req.url === '/error') {
    resp.statusCode = 500
    resp.end()
  }
  if (req.url === '/disconnect') {
    resp.socket.destroy()
  }
  resp.statusCode = 404
  resp.end()
}).listen(8080, function () {
  webtouch('http://localhost:8080/error', function (e) {
    assert.ok(e)
    ok('error')
    webtouch('http://localhost:8080/disconnect', function (e) {
      assert.ok(e)
      ok('disconnect')
      var ee = webtouch('http://localhost:8080/index.html', function (e, urls) {
        if (e) throw e
        assert.equal(urls.length, 3)
        ok('callback')
        d.cleanup()
      })
      ee.on('get', function (url) {ok(url)})
      ee.on('resp', function (resp, url) {ok(resp.statusCode + ' ' + url)})
    })
  })
})