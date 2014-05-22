var cheerio = require('cheerio')
  , request = require('request').defaults({headers:{'accept':'text/html'}})
  , url = require('url')
  , mime = require('mime')
  , async = require('async')
  , events = require('events')
  , _ = require('lodash')
  , cssParse = require('css-parse')
  ;

function cssURL (str) {
  var pre = str.indexOf('url(')
  if (pre !== -1) {
    var u = strip(str.slice(pre+'url('.length, str.indexOf(')', pre)))
    if (u.slice(0, 'data:'.length) === 'data:') return null
    return u
  }
}

function strip (str) {
  if (str[0] === '"' || str[0] === "'") str = str.slice(1)
  var end = str.length - 1
  if (str[end] === '"' || str[end] === "'") str = str.slice(0, end)
  return str
}

function parseUrl (_url, from) {
  var u = url.parse(url.resolve(from, _url))
    , str = u.protocol + '//' + u.host + u.pathname
    ;
  if (u.query) str += u.search
  return str
}

function touch (_url, opts, cb) {
  opts.ee.emit('get', _url)

  function _walk (links, _url, cb) {
    links = _.difference(links, opts.links)
    links = _.uniq(links)
    opts.links = opts.links.concat(links)

    if (links.length === 0) cb(null, _url)
    else {
      var parallel = links.map(function (l) { return function (cb) {touch(l, opts, cb)} })
      parallel.unshift(function (cb) {cb(null, _url)})
      async.parallel(parallel, cb)
    }
  }

  function _css (str, _url) {
    var rules = cssParse(str).stylesheet.rules
      , links = []
      ;
    function _onrule (rule) {
      if (rule.declarations) {
        rule.declarations.forEach(function (dec) {
          if (dec.value) {
            var l = cssURL(dec.value)
            if (l) links.push(parseUrl(l, _url))
          }
        })
      }
      if (rule.rules) rule.rules.forEach(_onrule)
    }

    rules.forEach(_onrule)
    return links
  }

  request(_url, {timeout:opts.timeout, headers:{accept:mime.lookup(_url, 'text/html')}}, function (e, resp, body) {
    if (e) {
      e.message += (' in ' + _url)
      return cb(e)
    }
    opts.ee.emit('resp', resp, _url)
    if (resp.statusCode !== 200) return cb(new Error('statusCode is not 200. received '+resp.statusCode+' in '+_url ))
    if (resp.headers['content-type'] && resp.headers['content-type'].indexOf('text/html') !== -1) {
      var $ = cheerio.load(body)
        , links = []
        ;

      function eachelem (i, elem) {
        function _do (txt) {
          var u = parseUrl(txt, _url)
          try {
            var parsed = url.parse(u)
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') links.push(u)
          } catch (e) {}
        }
        if (elem.attribs.href) _do(elem.attribs.href)
        else if (elem.attribs.src)  _do(elem.attribs.src)
        else if (elem.attribs.content) _do(elem.attribs.content)
      }

      if (opts.meta) $('meta').each(function (i, elem) {
        if (elem.attribs.itemprop === 'image') eachelem(i, elem)
      })
      if (opts.link) $('link').each(eachelem)
      if (opts.script) $('script').each(eachelem)
      if (opts.a) $('a').each(eachelem)
      if (opts.img) $('img').each(eachelem)

      $('style').each(function (i, elem) {
        if (!elem.children.length) return
        links = links.concat(_css(elem.children[0].data, _url))
      })

      _walk(links, _url, cb)
    } else if (resp.headers['content-type'] && resp.headers['content-type'].indexOf('text/css') !== -1) {
      _walk(_css(body, _url), _url, cb)
    } else {
      cb(null, _url)
    }
  })
}

function webtouch (urls, opts, cb) {
  if (typeof urls === 'string') urls = [urls]
  if (!cb) {
    cb = opts
    opts = {}
  }
  opts.ee = opts.ee || new events.EventEmitter()
  opts.links = urls
  if (typeof opts.link === 'undefined') opts.link = true
  if (typeof opts.script === 'undefined') opts.script = true
  if (typeof opts.img === 'undefined') opts.img = true
  if (typeof opts.meta === 'undefined') opts.meta = true
  if (typeof opts.a === 'undefined') opts.a = false

  // defer so that the 'get' event will fire properly
  var parallel = urls.map(function (l) { return function (cb) {touch(l, opts, cb)} })
  setImmediate(function () {
    async.parallel(parallel, function (e, urls) {
      cb(e, _.flatten(urls))
    })
  })

  return opts.ee
}

module.exports = webtouch
