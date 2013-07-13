### webtouch

`npm install webtouch`

Validate that a web site and all its required resources are available.

```javascript
var webtouch = require('webtouch')

webtouch('http://www.google.com', function (e, urls) {
  if (e) throw e
  console.log(urls)
})
```

The website will be parsed and all the resources in the html will be touched via an HTTP GET.

There's also an event emitter returned that you can use to monitor.

```javascript
webtouch('http://www.google.com').on('get', function (url) {console.log("fetching", url)})
```

#### webtouch(urls, [opts], cb)

* **`urls`** Either a string for a single url or an array of urls.
* **`opts`**
  * **`timeout`** A timeout in millisecond for each GET, this is *not* a timeout for the entire crawl.
  * **`img`** Fetch images, defaults to `true`.
  * **meta** Fetch images in meta tags where `itemprop === "image"`, defaults to `true`.
  * **script** Fetch scripts, defaults to true.
  * **`a`** Fetch and parse links, defaults to `false`. This method is dangerous since it basically turns webtouch in to a crawler that could potentially never return.
* **`cb`** `function (error, urls) {}` returns all of the urls that have been touched.

##### events

* *get* `function (url){}` The url that is about to be touched.
* *resp* `function (response, url){}` The http.ClientResponse object and url that was just touched.
