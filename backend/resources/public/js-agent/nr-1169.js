// modules are defined as an array
// [ module function, map of requires ]
//
// map of requireuires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (modules, cache, entry) { // eslint-disable-line no-extra-parens
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof __nr_require === 'function' && __nr_require

  function newRequire (name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof __nr_require === 'function' && __nr_require
        if (!jumped && currentRequire) return currentRequire(name, true)

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) return previousRequire(name, true)
        throw new Error("Cannot find module '" + name + "'")
      }
      var m = cache[name] = {exports: {}}
      modules[name][0].call(m.exports, function (x) {
        var id = modules[name][1][x]
        return newRequire(id || x)
      }, m, m.exports)
    }
    return cache[name].exports
  }
  for (var i = 0; i < entry.length; i++) newRequire(entry[i])

  // Override the current require with this new one
  return newRequire
})
({1:[function(require,module,exports){
// Safely add an event listener to window in any browser
module.exports = function (sType, callback) {
  if ('addEventListener' in window) {
    return window.addEventListener(sType, callback, false)
  } else if ('attachEvent' in window) {
    return window.attachEvent('on' + sType, callback)
  }
}

},{}],2:[function(require,module,exports){
// This product includes Apache 2.0 licensed source derived from 'episodes'
// by Steve Souders. Repository: https://github.com/stevesouders/episodes
// 
//   Copyright 2010 Google Inc.
// 
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
// 
//        http://www.apache.org/licenses/LICENSE-2.0
// 
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
// 
//   See the source code here:
//        https://github.com/stevesouders/episodes
// 
// This product includes MIT licensed source generated from 'Browserify'
// by James Halliday. Repository: https://github.com/substack/node-browserify.
// 
// This product includes MIT licensed source derived from 'TraceKit'
// by Onur Cakmak. Repository: https://github.com/occ/TraceKit
// 
//   TraceKit - Cross brower stack traces - github.com/occ/TraceKit
// 
//   Copyright (c) 2013 Onur Can Cakmak onur.cakmak@gmail.com and all TraceKit
//   contributors.
// 
//   Permission is hereby granted, free of charge, to any person obtaining a copy
//   of this software and associated documentation files (the 'Software'), to deal
//   in the Software without restriction, including without limitation the rights
//   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//   copies of the Software, and to permit persons to whom the Software is
//   furnished to do so, subject to the following conditions:
// 
//   The above copyright notice and this permission notice shall be included in
//   all copies or substantial portions of the Software.
// 
//   THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//   SOFTWARE.
// 
// All other components of this product are
// Copyright (c) 2010-2013 New Relic, Inc.  All rights reserved.
// 
// Certain inventions disclosed in this file may be claimed within
// patents owned or patent applications filed by New Relic, Inc. or third
// parties.
// 
// Subject to the terms of this notice, New Relic grants you a
// nonexclusive, nontransferable license, without the right to
// sublicense, to (a) install and execute one copy of these files on any
// number of workstations owned or controlled by you and (b) distribute
// verbatim copies of these files to third parties.  As a condition to the
// foregoing grant, you must provide this notice along with each copy you
// distribute and you must not remove, alter, or obscure this notice. All
// other use, reproduction, modification, distribution, or other
// exploitation of these files is strictly prohibited, except as may be set
// forth in a separate written license agreement between you and New
// Relic.  The terms of any such license agreement will control over this
// notice.  The license stated above will be automatically terminated and
// revoked if you exceed its scope or violate any of the terms of this
// notice.
// 
// This License does not grant permission to use the trade names,
// trademarks, service marks, or product names of New Relic, except as
// required for reasonable and customary use in describing the origin of
// this file and reproducing the content of this notice.  You may not
// mark or brand this file with any trade name, trademarks, service
// marks, or product names other than the original brand (if any)
// provided by New Relic.
// 
// Unless otherwise expressly agreed by New Relic in a separate written
// license agreement, these files are provided AS IS, WITHOUT WARRANTY OF
// ANY KIND, including without any implied warranties of MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE, TITLE, or NON-INFRINGEMENT.  As a
// condition to your use of these files, you are solely responsible for
// such use. New Relic will have no liability to you for direct,
// indirect, consequential, incidental, special, or punitive damages or
// for lost profits or data.
// 
// 

var mapOwn = require(36)

var aggregatedData = {}

module.exports = {
  store: store,
  take: take,
  get: get
}

// Items with the same type and name get aggregated together
// params are example data from the aggregated items
// metrics are the numeric values to be aggregated
function store (type, name, params, newMetrics, customParams) {
  if (!aggregatedData[type]) aggregatedData[type] = {}
  var bucket = aggregatedData[type][name]
  if (!bucket) {
    bucket = aggregatedData[type][name] = { params: params || {} }
    if (customParams) {
      bucket.custom = customParams
    }
  }
  bucket.metrics = aggregateMetrics(newMetrics, bucket.metrics)
  return bucket
}

function aggregateMetrics (newMetrics, oldMetrics) {
  if (!oldMetrics) oldMetrics = {count: 0}
  oldMetrics.count += 1
  mapOwn(newMetrics, function (key, value) {
    oldMetrics[key] = updateMetric(value, oldMetrics[key])
  })
  return oldMetrics
}

function updateMetric (value, metric) {
  // When there is only one data point, the c (count), min, max, and sos (sum of squares) params are superfluous.
  if (!metric) return {t: value}

  // but on the second data point, we need to calculate the other values before aggregating in new values
  if (metric && !metric.c) {
    metric = {
      t: metric.t,
      min: metric.t,
      max: metric.t,
      sos: metric.t * metric.t,
      c: 1
    }
  }

  metric.c += 1
  metric.t += value
  metric.sos += value * value
  if (value > metric.max) metric.max = value
  if (value < metric.min) metric.min = value
  return metric
}

function get (type, name) {
  // if name is passed, get a single bucket
  if (name) return aggregatedData[type] && aggregatedData[type][name]
  // else, get all buckets of that type
  return aggregatedData[type]
}

// Like get, but for many types and it deletes the retrieved content from the aggregatedData
function take (types) {
  var results = {}
  var type = ''
  var hasData = false
  for (var i = 0; i < types.length; i++) {
    type = types[i]
    results[type] = toArray(aggregatedData[type])
    if (results[type].length) hasData = true
    delete aggregatedData[type]
  }
  return hasData ? results : null
}

function toArray (obj) {
  if (typeof obj !== 'object') return []

  return mapOwn(obj, getValue)
}

function getValue (key, value) {
  return value
}

},{}],3:[function(require,module,exports){
var register = require(17)
var harvest = require(9)
var agg = require(2)
var single = require(19)
var submitData = require(23)
var mapOwn = require(36)
var loader = require("loader")
var handle = require("handle")
var cycle = 0

harvest.on('jserrors', function () {
  return { body: agg.take([ 'cm' ]) }
})

var api = {
  finished: single(finished),
  setPageViewName: setPageViewName,
  setErrorHandler: setErrorHandler,
  addToTrace: addToTrace,
  inlineHit: inlineHit,
  addRelease: addRelease
}

// Hook all of the api functions up to the queues/stubs created in loader/api.js
mapOwn(api, function (fnName, fn) {
  register('api-' + fnName, fn, 'api')
})

// All API functions get passed the time they were called as their
// first parameter. These functions can be called asynchronously.

function setPageViewName (t, name, host) {
  if (typeof name !== 'string') return
  if (name.charAt(0) !== '/') name = '/' + name
  loader.customTransaction = (host || 'http://custom.transaction') + name
}

function finished (t, providedTime) {
  var time = providedTime ? providedTime - loader.offset : t
  agg.store('cm', 'finished', { name: 'finished' }, { time: time })
  addToTrace(t, { name: 'finished', start: time + loader.offset, origin: 'nr' })
  handle('api-addPageAction', [ time, 'finished' ])
}

function addToTrace (t, evt) {
  if (!(evt && typeof evt === 'object' && evt.name && evt.start)) return

  var report = {
    n: evt.name,
    s: evt.start - loader.offset,
    e: (evt.end || evt.start) - loader.offset,
    o: evt.origin || '',
    t: 'api'
  }

  handle('bstApi', [report])
}

// NREUM.inlineHit(request_name, queue_time, app_time, total_be_time, dom_time, fe_time)
//
// request_name - the 'web page' name or service name
// queue_time - the amount of time spent in the app tier queue
// app_time - the amount of time spent in the application code
// total_be_time - the total roundtrip time of the remote service call
// dom_time - the time spent processing the result of the service call (or user defined)
// fe_time - the time spent rendering the result of the service call (or user defined)
function inlineHit (t, request_name, queue_time, app_time, total_be_time, dom_time, fe_time) {
  request_name = window.encodeURIComponent(request_name)
  cycle += 1

  if (!loader.info.beacon) return

  var url = 'https://' + loader.info.beacon + '/1/' + loader.info.licenseKey

  url += '?a=' + loader.info.applicationID + '&'
  url += 't=' + request_name + '&'
  url += 'qt=' + ~~queue_time + '&'
  url += 'ap=' + ~~app_time + '&'
  url += 'be=' + ~~total_be_time + '&'
  url += 'dc=' + ~~dom_time + '&'
  url += 'fe=' + ~~fe_time + '&'
  url += 'c=' + cycle

  submitData.img(url)
}

function setErrorHandler (t, handler) {
  loader.onerror = handler
}

var releaseCount = 0
function addRelease (t, name, id) {
  if (++releaseCount > 10) return
  loader.releaseIds[name.slice(-200)] = ('' + id).slice(-200)
}

},{}],4:[function(require,module,exports){
var mapOwn = require(36)
var stringify = require(22)

var hasOwnProp = Object.prototype.hasOwnProperty
var MAX_ATTRIBUTES = 64

module.exports = {
  nullable: nullable,
  numeric: numeric,
  getAddStringContext: getAddStringContext,
  addCustomAttributes: addCustomAttributes
}

function nullable (val, fn, comma) {
  return val || val === 0 || val === ''
    ? fn(val) + (comma ? ',' : '')
    : '!'
}

function numeric (n, noDefault) {
  if (noDefault) {
    return Math.floor(n).toString(36)
  }
  return (n === undefined || n === 0) ? '' : Math.floor(n).toString(36)
}

function getAddStringContext () {
  var stringTable = Object.hasOwnProperty('create') ? Object.create(null) : {}
  var stringTableIdx = 0

  return addString

  function addString(str) {
    if (typeof str === 'undefined' || str === '') return ''
    str = String(str)
    if (hasOwnProp.call(stringTable, str)) {
      return numeric(stringTable[str], true)
    } else {
      stringTable[str] = stringTableIdx++
      return quoteString(str)
    }
  }
}

function addCustomAttributes (attrs, addString) {
  var attrParts = []

  mapOwn(attrs, function (key, val) {
    if (attrParts.length >= MAX_ATTRIBUTES) return
    var type = 5
    var serializedValue
    // add key to string table first
    key = addString(key)

    switch (typeof val) {
      case 'object':
        if (val) {
          // serialize objects to strings
          serializedValue = addString(stringify(val))
        } else {
          // null attribute type
          type = 9
        }
        break
      case 'number':
        type = 6
        // make sure numbers contain a `.` so they are parsed as doubles
        serializedValue = val % 1 ? val : val + '.'
        break
      case 'boolean':
        type = val ? 7 : 8
        break
      case 'undefined':
        // we treat undefined as a null attribute (since dirac does not have a concept of undefined)
        type = 9
        break
      default:
        serializedValue = addString(val)
    }

    attrParts.push([type, key + (serializedValue ? ',' + serializedValue : '')])
  })

  return attrParts
}

var escapable = /([,\\;])/g

function quoteString (str) {
  return "'" + str.replace(escapable, '\\$1')
}

},{}],5:[function(require,module,exports){
var withHash = /([^?#]*)[^#]*(#[^?]*|$).*/
var withoutHash = /([^?#]*)().*/
module.exports = function cleanURL (url, keepHash) {
  return url.replace(keepHash ? withHash : withoutHash, '$1$2')
}

},{}],6:[function(require,module,exports){
var baseEE = require("ee")
var mapOwn = require(36)
var handlers = require(17).handlers

module.exports = function drain (group) {
  var bufferedEventsInGroup = baseEE.backlog[group]
  var groupHandlers = handlers[group]
  if (groupHandlers) {
    // don't cache length, buffer can grow while processing
    for (var i = 0; bufferedEventsInGroup && i < bufferedEventsInGroup.length; ++i) { // eslint-disable-line no-unmodified-loop-condition
      emitEvent(bufferedEventsInGroup[i], groupHandlers)
    }

    mapOwn(groupHandlers, function (eventType, handlerRegistrationList) {
      mapOwn(handlerRegistrationList, function (i, registration) {
        // registration is an array of: [targetEE, eventHandler]
        registration[0].on(eventType, registration[1])
      })
    })
  }

  delete handlers[group]
  // Keep the group as a property so we know it was created and drained
  baseEE.backlog[group] = null
}

function emitEvent (evt, groupHandlers) {
  var type = evt[1]
  mapOwn(groupHandlers[type], function (i, registration) {
    var sourceEE = evt[0]
    var ee = registration[0]
    if (ee === sourceEE) {
      var handler = registration[1]
      var ctx = evt[3]
      var args = evt[2]
      handler.apply(ctx, args)
    }
  })
}

},{}],7:[function(require,module,exports){
var mapOwn = require(36)
var stringify = require(22)

  // Characters that are safe in a qs, but get encoded.
var charMap = {
  '%2C': ',',
  '%3A': ':',
  '%2F': '/',
  '%40': '@',
  '%24': '$',
  '%3B': ';'
}

var charList = mapOwn(charMap, function (k) { return k })
var safeEncoded = new RegExp(charList.join('|'), 'g')

function real (c) {
  return charMap[c]
}

// Encode as URI Component, then unescape anything that is ok in the
// query string position.
function qs (value) {
  if (value === null || value === undefined) return 'null'
  return encodeURIComponent(value).replace(safeEncoded, real)
}

module.exports = {obj: obj, fromArray: fromArray, qs: qs, param: param}

function fromArray (qs, maxBytes) {
  var bytes = 0
  for (var i = 0; i < qs.length; i++) {
    bytes += qs[i].length
    if (bytes > maxBytes) return qs.slice(0, i).join('')
  }
  return qs.join('')
}

function obj (payload, maxBytes) {
  var total = 0
  var result = ''

  mapOwn(payload, function (feature, dataArray) {
    var intermediate = []
    var next
    var i

    if (typeof dataArray === 'string') {
      next = '&' + feature + '=' + qs(dataArray)
      total += next.length
      result += next
    } else if (dataArray.length) {
      total += 9
      for (i = 0; i < dataArray.length; i++) {
        next = qs(stringify(dataArray[i]))

        // TODO: Consider more complete ways of handling too much error data.
        total += next.length
        if (typeof maxBytes !== 'undefined' && total >= maxBytes) break
        intermediate.push(next)
      }
      result += '&' + feature + '=%5B' + intermediate.join(',') + '%5D'
    }
  })
  return result
}

// Constructs an HTTP parameter to add to the BAM router URL
function param (name, value) {
  if (value && typeof (value) === 'string') {
    return '&' + name + '=' + qs(value)
  }
  return ''
}

},{}],8:[function(require,module,exports){
var mapOwn = require(36)
var ee = require("ee")
var drain = require(6)

module.exports = function activateFeatures (flags) {
  if (!(flags && typeof flags === 'object')) return
  mapOwn(flags, function (flag, val) {
    if (!val || activatedFeatures[flag]) return
    ee.emit('feat-' + flag, [])
    activatedFeatures[flag] = true
  })

  drain('feature')
}

var activatedFeatures = module.exports.active = {}

},{}],9:[function(require,module,exports){
var single = require(19)
var mapOwn = require(36)
var timing = require(15)
var encode = require(7)
var stringify = require(22)
var submitData = require(23)
var reduce = require(39)
var aggregator = require(2)
var stopwatch = require(21)
var loader = require("loader")
var locationUtil = require(13)

var cleanURL = require(5)

var version = '1169.7b094c0'
var jsonp = 'NREUM.setToken'
var _events = {}
var haveSendBeacon = !!navigator.sendBeacon

// requiring ie version updates the IE version on the loader object
require(10)
var xhrUsable = loader.ieVersion > 9 || loader.ieVersion === 0

var addPaintMetric = require(16).addMetric

module.exports = {
  sendRUM: single(sendRUM), // wrapping this in single makes it so that it can only be called once from outside
  sendFinal: sendAllFromUnload,
  pingErrors: pingErrors,
  sendX: sendX,
  send: send,
  on: on,
  xhrUsable: xhrUsable
}

// nr is injected into all send methods. This allows for easier testing
// we could require('loader') instead
function sendRUM (nr) {
  if (!nr.info.beacon) return
  if (nr.info.queueTime) aggregator.store('measures', 'qt', { value: nr.info.queueTime })
  if (nr.info.applicationTime) aggregator.store('measures', 'ap', { value: nr.info.applicationTime })

  // some time in the past some code will have called stopwatch.mark('starttime', Date.now())
  // calling measure like this will create a metric that measures the time differential between
  // the two marks.
  stopwatch.measure('be', 'starttime', 'firstbyte')
  stopwatch.measure('fe', 'firstbyte', 'onload')
  stopwatch.measure('dc', 'firstbyte', 'domContent')

  var measuresMetrics = aggregator.get('measures')

  var measuresQueryString = mapOwn(measuresMetrics, function (metricName, measure) {
    return '&' + metricName + '=' + measure.params.value
  }).join('')

  if (measuresQueryString) {
    // currently we only have one version of our protocol
    // in the future we may add more
    var protocol = '1'

    var chunksForQueryString = [baseQueryString(nr)]

    chunksForQueryString.push(measuresQueryString)

    chunksForQueryString.push(encode.param('tt', nr.info.ttGuid))
    chunksForQueryString.push(encode.param('us', nr.info.user))
    chunksForQueryString.push(encode.param('ac', nr.info.account))
    chunksForQueryString.push(encode.param('pr', nr.info.product))
    chunksForQueryString.push(encode.param('af', mapOwn(nr.features, function (k) { return k }).join(',')))

    if (window.performance && typeof (window.performance.timing) !== 'undefined') {
      var navTimingApiData = ({
        timing: timing.addPT(window.performance.timing, {}),
        navigation: timing.addPN(window.performance.navigation, {})
      })
      chunksForQueryString.push(encode.param('perf', stringify(navTimingApiData)))
    }

    if (window.performance && window.performance.getEntriesByType) {
      var entries = window.performance.getEntriesByType('paint')
      entries.forEach(function(entry) {
        if (!entry.startTime || entry.startTime <= 0) return

        if (entry.name === 'first-paint') {
          chunksForQueryString.push(encode.param('fp',
            String(Math.floor(entry.startTime))))
        } else if (entry.name === 'first-contentful-paint') {
          chunksForQueryString.push(encode.param('fcp',
            String(Math.floor(entry.startTime))))
        }
        addPaintMetric(entry.name, Math.floor(entry.startTime))
      })
    }

    chunksForQueryString.push(encode.param('xx', nr.info.extra))
    chunksForQueryString.push(encode.param('ua', nr.info.userAttributes))
    chunksForQueryString.push(encode.param('at', nr.info.atts))

    var customJsAttributes = stringify(nr.info.jsAttributes)
    chunksForQueryString.push(encode.param('ja', customJsAttributes === '{}' ? null : customJsAttributes))

    var queryString = encode.fromArray(chunksForQueryString, nr.maxBytes)

    submitData.jsonp(
      'https://' + nr.info.beacon + '/' + protocol + '/' + nr.info.licenseKey + queryString,
      jsonp
    )
  }
}

function sendAllFromUnload (nr) {
  var sents = mapOwn(_events, function (endpoint) {
    return sendX(endpoint, nr, { unload: true })
  })
  return reduce(sents, or)
}

function or (a, b) { return a || b }

function createPayload (type) {
  var makeBody = add({})
  var makeQueryString = add({})
  var listeners = (_events[type] || [])

  for (var i = 0; i < listeners.length; i++) {
    var singlePayload = listeners[i]()
    if (singlePayload.body) mapOwn(singlePayload.body, makeBody)
    if (singlePayload.qs) mapOwn(singlePayload.qs, makeQueryString)
  }
  return { body: makeBody(), qs: makeQueryString() }
}

/**
 * Initiate a harvest from multiple sources. An event that corresponds to the endpoint
 * name is emitted, which gives any listeners the opportunity to provide payload data.
 *
 * @param {string} endpoint - The endpoint of the harvest (jserrors, events, resources etc.)
 * @param {object} nr - The loader singleton.
 *
 * @param {object} opts
 * @param {bool} opts.needResponse - Specify whether the caller expects a response data.
 * @param {bool} opts.unload - Specify whether the call is a final harvest during page unload.
 */
function sendX (endpoint, nr, opts) {
  return send(endpoint, nr, createPayload(endpoint), opts)
}

/**
 * Initiate a harvest call.
 *
 * @param {string} endpoint - The endpoint of the harvest (jserrors, events, resources etc.)
 * @param {object} nr - The loader singleton.
 *
 * @param {object} payload - Object representing payload.
 * @param {object} payload.qs - Map of values that should be sent as part of the request query string.
 * @param {string} payload.body - String that should be sent as the body of the request.
 * @param {string} payload.body.e - Special case of body used for browser interactions.
 *
 * @param {object} opts
 * @param {bool} opts.needResponse - Specify whether the caller expects a response data.
 * @param {bool} opts.unload - Specify whether the call is a final harvest during page unload.
 */
function send (endpoint, nr, payload, opts) {
  if (!(nr.info.errorBeacon && payload.body)) return false
  if (!opts) opts = {}

  var url = 'https://' + nr.info.errorBeacon + '/' + endpoint + '/1/' + nr.info.licenseKey + baseQueryString(nr)
  if (payload.qs) url += encode.obj(payload.qs, nr.maxBytes)

  var method
  var useBody
  var body

  switch (endpoint) {
    case 'jserrors':
      useBody = false
      method = haveSendBeacon ? submitData.beacon : submitData.img
      break
    default:
      if (opts.needResponse) {
        useBody = true
        method = submitData.xhr
      } else if (opts.unload) {
        useBody = haveSendBeacon
        method = haveSendBeacon ? submitData.beacon : submitData.img
      } else {
        // `submitData.beacon` was removed, there is an upper limit to the
        // number of data allowed before it starts failing, so we save it for
        // unload data
        if (xhrUsable) {
          useBody = true
          method = submitData.xhr
        } else if (endpoint === 'events') {
          method = submitData.img
        } else {
          return false
        }
      }
      break
  }

  var fullUrl = url
  if (useBody && endpoint === 'events') {
    body = payload.body.e
  } else if (useBody) {
    body = stringify(payload.body)
  } else {
    fullUrl = url + encode.obj(payload.body, nr.maxBytes)
  }

  var result = method(fullUrl, body)

  // if beacon request failed, retry with an alternative method
  if (!result && method === submitData.beacon) {
    result = submitData.img(url + encode.obj(payload.body, nr.maxBytes))
  }
  return result
}

function pingErrors (nr) {
  if (!(nr && nr.info && nr.info.errorBeacon && nr.ieVersion)) return

  var url = 'https://' + nr.info.errorBeacon + '/jserrors/ping/' + nr.info.licenseKey + baseQueryString(nr)

  submitData.img(url)
}

// Constructs the transaction name param for the beacon URL.
// Prefers the obfuscated transaction name over the plain text.
// Falls back to making up a name.
function transactionNameParam (nr) {
  if (nr.info.transactionName) return encode.param('to', nr.info.transactionName)
  return encode.param('t', nr.info.tNamePlain || 'Unnamed Transaction')
}

function on (type, fn) {
  var listeners = (_events[type] || (_events[type] = []))
  listeners.push(fn)
}

// The stuff that gets sent every time.
function baseQueryString (nr) {
  var areCookiesEnabled = true
  if ('init' in NREUM && 'privacy' in NREUM.init) {
    areCookiesEnabled = NREUM.init.privacy.cookies_enabled
  }

  return ([
    '?a=' + nr.info.applicationID,
    encode.param('sa', (nr.info.sa ? '' + nr.info.sa : '')),
    encode.param('v', version),
    transactionNameParam(nr),
    encode.param('ct', nr.customTransaction),
    '&rst=' + nr.now(),
    '&ck=' + (areCookiesEnabled ? '1' : '0'),
    encode.param('ref', cleanURL(locationUtil.getLocation()))
  ].join(''))
}

function add (payload) {
  var hasData = false
  return function (key, val) {
    if (val && val.length) {
      payload[key] = val
      hasData = true
    }
    if (hasData) return payload
  }
}

},{}],10:[function(require,module,exports){
var loader = require("loader")
var div = document.createElement('div')

div.innerHTML = '<!--[if lte IE 6]><div></div><![endif]-->' +
  '<!--[if lte IE 7]><div></div><![endif]-->' +
  '<!--[if lte IE 8]><div></div><![endif]-->' +
  '<!--[if lte IE 9]><div></div><![endif]-->'

var len = div.getElementsByTagName('div').length

if (len === 4) loader.ieVersion = 6
else if (len === 3) loader.ieVersion = 7
else if (len === 2) loader.ieVersion = 8
else if (len === 1) loader.ieVersion = 9
else loader.ieVersion = 0

module.exports = loader.ieVersion

},{}],11:[function(require,module,exports){
var stopwatch = require(21)
var subscribeToUnload = require(25)
var harvest = require(9)
var registerHandler = require(17)
var activateFeatures = require(8)
var loader = require("loader")
var drain = require(6)
var navCookie = require(14)

// api loads registers several event listeners, but does not have any exports
require(3)

// Register event listeners and schedule harvests for performance timings.
require(24)

var autorun = typeof (window.NREUM.autorun) !== 'undefined' ? window.NREUM.autorun : true

// Features are activated using the legacy setToken function name via JSONP
window.NREUM.setToken = activateFeatures

if (require(10) === 6) loader.maxBytes = 2000
else loader.maxBytes = 30000

loader.releaseIds = {}

subscribeToUnload(finalHarvest)

registerHandler('mark', stopwatch.mark, 'api')

stopwatch.mark('done')

drain('api')

if (autorun) harvest.sendRUM(loader)

// Set a cookie when the page unloads. Consume this cookie on the next page to get a 'start time'.
// The navigation start time cookie is removed when the browser supports the web timing API.
// Doesn't work in some browsers (Opera).
function finalHarvest (e) {
  harvest.sendFinal(loader, false)
  // write navigation start time cookie if needed
  navCookie.conditionallySet()
}

},{}],12:[function(require,module,exports){
module.exports = function interval (fn, ms) {
  setTimeout(function tick () {
    try {
      fn()
    } finally {
      setTimeout(tick, ms)
    }
  }, ms)
}

},{}],13:[function(require,module,exports){
module.exports = {
  getLocation: getLocation
}

function getLocation() {
  return '' + location
}

},{}],14:[function(require,module,exports){
var sHash = require(18)
var startTime = require(20)

// functions are on object, so that they can be mocked
var exp = {
  conditionallySet: conditionallySet,
  setCookie: setCookie
}

module.exports = exp

function conditionallySet() {
  var areCookiesEnabled = true
  if ('init' in NREUM && 'privacy' in NREUM.init) {
    areCookiesEnabled = NREUM.init.privacy.cookies_enabled
  }

  if (startTime.navCookie && areCookiesEnabled) {
    exp.setCookie()
  }
}

function setCookie() {
  document.cookie = 'NREUM=s=' + Number(new Date()) + '&r=' + sHash(document.location.href) + '&p=' + sHash(document.referrer) + '; path=/'
}

},{}],15:[function(require,module,exports){
// We don't use JSON.stringify directly on the performance timing data for these reasons:
// * Chrome has extra data in the performance object that we don't want to send all the time (wasteful)
// * Firefox fails to stringify the native object due to - http://code.google.com/p/v8/issues/detail?id=1223
// * The variable names are long and wasteful to transmit

// Add Performance Timing values to the given object.
// * Values are written relative to an offset to reduce their length (i.e. number of characters).
// * The offset is sent with the data
// * 0's are not included unless the value is a 'relative zero'
//

var START = 'Start'
var END = 'End'
var UNLOAD_EVENT = 'unloadEvent'
var REDIRECT = 'redirect'
var DOMAIN_LOOKUP = 'domainLookup'
var ONNECT = 'onnect'
var REQUEST = 'request'
var RESPONSE = 'response'
var LOAD_EVENT = 'loadEvent'
var DOM_CONTENT_LOAD_EVENT = 'domContentLoadedEvent'

var navTimingValues = []
module.exports = {
  addPT: addPT,
  addPN: addPN,
  nt: navTimingValues
}

function addPT (pt, v) {
  var offset = pt['navigation' + START]
  v.of = offset
  addRel(offset, offset, v, 'n')
  addRel(pt[UNLOAD_EVENT + START], offset, v, 'u')
  addRel(pt[REDIRECT + START], offset, v, 'r')
  addRel(pt[UNLOAD_EVENT + END], offset, v, 'ue')
  addRel(pt[REDIRECT + END], offset, v, 're')
  addRel(pt['fetch' + START], offset, v, 'f')
  addRel(pt[DOMAIN_LOOKUP + START], offset, v, 'dn')
  addRel(pt[DOMAIN_LOOKUP + END], offset, v, 'dne')
  addRel(pt['c' + ONNECT + START], offset, v, 'c')
  addRel(pt['secureC' + ONNECT + 'ion' + START], offset, v, 's')
  addRel(pt['c' + ONNECT + END], offset, v, 'ce')
  addRel(pt[REQUEST + START], offset, v, 'rq')
  addRel(pt[RESPONSE + START], offset, v, 'rp')
  addRel(pt[RESPONSE + END], offset, v, 'rpe')
  addRel(pt.domLoading, offset, v, 'dl')
  addRel(pt.domInteractive, offset, v, 'di')
  addRel(pt[DOM_CONTENT_LOAD_EVENT + START], offset, v, 'ds')
  addRel(pt[DOM_CONTENT_LOAD_EVENT + END], offset, v, 'de')
  addRel(pt.domComplete, offset, v, 'dc')
  addRel(pt[LOAD_EVENT + START], offset, v, 'l')
  addRel(pt[LOAD_EVENT + END], offset, v, 'le')
  return v
}

// Add Performance Navigation values to the given object
function addPN (pn, v) {
  addRel(pn.type, 0, v, 'ty')
  addRel(pn.redirectCount, 0, v, 'rc')
  return v
}

function addRel (value, offset, obj, prop) {
  var relativeValue
  if (typeof (value) === 'number' && (value > 0)) {
    relativeValue = Math.round(value - offset)
    obj[prop] = relativeValue
  }
  navTimingValues.push(relativeValue)
}

},{}],16:[function(require,module,exports){
var paintMetrics = {}

module.exports = {
  addMetric: addMetric,
  metrics: paintMetrics
}

function addMetric (name, value) {
  paintMetrics[name] = value
}

},{}],17:[function(require,module,exports){
var handleEE = require("handle").ee

module.exports = defaultRegister

defaultRegister.on = registerWithSpecificEmitter

var handlers = defaultRegister.handlers = {}

function defaultRegister (type, handler, group, ee) {
  registerWithSpecificEmitter(ee || handleEE, type, handler, group)
}

function registerWithSpecificEmitter (ee, type, handler, group) {
  if (!group) group = 'feature'
  if (!ee) ee = handleEE
  var groupHandlers = handlers[group] = handlers[group] || {}
  var list = groupHandlers[type] = groupHandlers[type] || []
  list.push([ee, handler])
}

},{}],18:[function(require,module,exports){
module.exports = sHash

function sHash (s) {
  var i
  var h = 0

  for (i = 0; i < s.length; i++) {
    h += ((i + 1) * s.charCodeAt(i))
  }
  return Math.abs(h)
}

},{}],19:[function(require,module,exports){
var slice = require(37)

module.exports = single

function single (fn) {
  var called = false
  var res

  return function () {
    if (called) return res
    called = true
    res = fn.apply(this, slice(arguments))
    return res
  }
}

},{}],20:[function(require,module,exports){
// Use various techniques to determine the time at which this page started and whether to capture navigation timing information

var sHash = require(18)
var stopwatch = require(21)
var loader = require("loader")
var ffVersion = require(35)

module.exports = { navCookie: true }

findStartTime()

function findStartTime () {
  var starttime = findStartWebTiming() || findStartCookie()

  if (!starttime) return

  stopwatch.mark('starttime', starttime)
  // Refine loader.offset
  loader.offset = starttime
}

// Find the start time from the Web Timing 'performance' object.
// http://test.w3.org/webperf/specs/NavigationTiming/
// http://blog.chromium.org/2010/07/do-you-know-how-slow-your-web-page-is.html
function findStartWebTiming () {
  // FF 7/8 has a bug with the navigation start time, so use cookie instead of native interface
  if (ffVersion && ffVersion < 9) return

  var performanceCheck = require(38)
  if (performanceCheck.exists) {
    // note that we don't need to use a cookie to record navigation start time
    module.exports.navCookie = false
    return window.performance.timing.navigationStart
  }
}

// Find the start time based on a cookie set by Episodes in the unload handler.
function findStartCookie () {
  var aCookies = document.cookie.split(' ')

  for (var i = 0; i < aCookies.length; i++) {
    if (aCookies[i].indexOf('NREUM=') === 0) {
      var startPage
      var referrerPage
      var aSubCookies = aCookies[i].substring('NREUM='.length).split('&')
      var startTime
      var bReferrerMatch

      for (var j = 0; j < aSubCookies.length; j++) {
        if (aSubCookies[j].indexOf('s=') === 0) {
          startTime = aSubCookies[j].substring(2)
        } else if (aSubCookies[j].indexOf('p=') === 0) {
          referrerPage = aSubCookies[j].substring(2)
          // if the sub-cookie is not the last cookie it will have a trailing ';'
          if (referrerPage.charAt(referrerPage.length - 1) === ';') {
            referrerPage = referrerPage.substr(0, referrerPage.length - 1)
          }
        } else if (aSubCookies[j].indexOf('r=') === 0) {
          startPage = aSubCookies[j].substring(2)
          // if the sub-cookie is not the last cookie it will have a trailing ';'
          if (startPage.charAt(startPage.length - 1) === ';') {
            startPage = startPage.substr(0, startPage.length - 1)
          }
        }
      }

      if (startPage) {
        var docReferrer = sHash(document.referrer)
        bReferrerMatch = (docReferrer == startPage) // eslint-disable-line
        if (!bReferrerMatch) {
          // Navigation did not start at the page that was just exited, check for re-load
          // (i.e. the page just exited is the current page and the referring pages match)
          bReferrerMatch = sHash(document.location.href) == startPage && docReferrer == referrerPage // eslint-disable-line
        }
      }
      if (bReferrerMatch && startTime) {
        var now = new Date().getTime()
        if ((now - startTime) > 60000) {
          return
        }
        return startTime
      }
    }
  }
}

},{}],21:[function(require,module,exports){
var aggregator = require(2)
var loader = require("loader")

var marks = {}

module.exports = {
  mark: mark,
  measure: measure
}

function mark (markName, markTime) {
  if (typeof markTime === 'undefined') markTime = (loader.now() + loader.offset)
  marks[markName] = markTime
}

function measure (metricName, startMark, endMark) {
  var start = marks[startMark]
  var end = marks[endMark]

  if (typeof start === 'undefined' || typeof end === 'undefined') return

  aggregator.store('measures', metricName, { value: end - start })
}

},{}],22:[function(require,module,exports){
var mapOwn = require(36)
var ee = require("ee")

var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g // eslint-disable-line
var meta = {
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\f': '\\f',
  '\r': '\\r',
  '"': '\\"',
  '\\': '\\\\'
}

module.exports = stringify

function stringify (val) {
  try {
    return str('', {'': val})
  } catch (e) {
    try {
      ee.emit('internal-error', [e])
    } catch (err) {
    }
  }
}

function quote (string) {
  escapable.lastIndex = 0
  return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
    var c = meta[a]
    return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4)
  }) + '"' : '"' + string + '"'
}

function str (key, holder) {
  var value = holder[key]

  switch (typeof value) {
    case 'string':
      return quote(value)
    case 'number':
      return isFinite(value) ? String(value) : 'null'
    case 'boolean':
      return String(value)
    case 'object':
      if (!value) { return 'null' }
      var partial = []

      // The value is an array. Stringify every element. Use null as a placeholder
      // for non-JSON values.
      if (value instanceof window.Array || Object.prototype.toString.apply(value) === '[object Array]') {
        var length = value.length
        for (var i = 0; i < length; i += 1) {
          partial[i] = str(i, value) || 'null'
        }

        return partial.length === 0 ? '[]' : '[' + partial.join(',') + ']'
      }

      mapOwn(value, function (k) {
        var v = str(k, value)
        if (v) partial.push(quote(k) + ':' + v)
      })

      return partial.length === 0 ? '{}' : '{' + partial.join(',') + '}'
  }
}

},{}],23:[function(require,module,exports){
var submitData = module.exports = {}

submitData.jsonp = function jsonp (url, jsonp) {
  var element = document.createElement('script')
  element.type = 'text/javascript'
  element.src = url + '&jsonp=' + jsonp
  var firstScript = document.getElementsByTagName('script')[0]
  firstScript.parentNode.insertBefore(element, firstScript)
  return element
}

submitData.xhr = function xhr (url, body, sync) {
  var request = new XMLHttpRequest()

  request.open('POST', url, !sync)
  try {
    // Set cookie
    if ('withCredentials' in request) request.withCredentials = true
  } catch (e) {}

  request.setRequestHeader('content-type', 'text/plain')
  request.send(body)
  return request
}

submitData.xhrSync = function xhrSync (url, body) {
  return submitData.xhr(url, body, true)
}

submitData.img = function img (url) {
  var element = new Image()
  element.src = url
  return element
}

submitData.beacon = function (url, body) {
  return navigator.sendBeacon(url, body)
}

},{}],24:[function(require,module,exports){
var nullable = require(4).nullable
var numeric = require(4).numeric
var getAddStringContext = require(4).getAddStringContext
var addCustomAttributes = require(4).addCustomAttributes

module.exports = {
  getPayload: getPayload
}

// collect page view timings unless the feature is explicitly disabled
if ('init' in NREUM && 'page_view_timing' in NREUM.init &&
  'enabled' in NREUM.init.page_view_timing &&
  NREUM.init.page_view_timing.enabled === false) {
  return
}

var loader = require("loader")
var harvest = require(9)
var register = require(17)
var interval = require(12)
var subscribeToUnload = require(25)

var harvestTimeSeconds = 30
var timings = []
var lcpRecorded = false
var lcp = null
var MAX_LCP_TIMEOUT = 60000

register('timing', processTiming)
register('lcp', updateLatestLcp)

// final harvest is initiated from the main agent module, but since harvesting
// here is not initiated by the harvester, we need to subscribe to the unload event
// separately
subscribeToUnload(finalHarvest)

// After 1 minute has passed, record LCP value if no user interaction has occurred first
setTimeout(recordLcp, MAX_LCP_TIMEOUT)

function recordLcp() {
  if (!lcpRecorded && lcp !== null) {
    timings.push({
      name: 'lcp',
      value: Math.floor(lcp.startTime),
      attrs: {'size': lcp.size, 'eid': lcp.id}
    })
    lcpRecorded = true
  }
}

function updateLatestLcp(lcpObject) {
  lcp = lcpObject
}

function recordUnload() {
  timings.push({
    name: 'unload',
    value: loader.now()
  })
}

function processTiming(name, value, attrs) {
  // Upon user interaction, the Browser stops executing LCP logic, so we can send here
  // We're using setTimeout to give the Browser time to finish collecting LCP value
  if (name === 'fi') {
    setTimeout(recordLcp, 0)
  }

  timings.push({
    name: name,
    value: value,
    attrs: attrs
  })
}

// send initial data sooner, then start regular
setTimeout(function tick() {
  runHarvest()
  interval(runHarvest, harvestTimeSeconds * 1000)
}, 10000)

function runHarvest (final) {
  if (timings.length === 0) return
  var payload = getPayload(timings)
  harvest.send('events', loader, {body: { e: payload }}, { unload: !!final })
  timings = []
}

function finalHarvest() {
  recordLcp()
  recordUnload()
  runHarvest(true)
}

function getPayload(data) {
  var addString = getAddStringContext()

  var payload = 'bel.6;'

  for (var i = 0; i < data.length; i++) {
    var timing = data[i]
    payload += 'e,'
    payload += addString(timing.name) + ','
    payload += nullable(timing.value, numeric, false) + ','

    var attrParts = addCustomAttributes(timing.attrs, addString)
    if (attrParts && attrParts.length > 0) {
      payload += attrParts.length + ';' + attrParts.join(';')
    }

    if ((i + 1) < data.length) payload += ';'
  }

  return payload
}

},{}],25:[function(require,module,exports){
var ffVersion = require(35)
var single = require(19)
var addE = require(1)

module.exports = subscribeToUnload

// Used to subscribe a callback to when a page is being unloaded. This is used,
// for example, to submit a final harvest.
function subscribeToUnload (cb) {
  var oneCall = single(cb)

  // Firefox has a bug wherein a slow-loading resource loaded from the 'pagehide'
  // or 'unload' event will delay the 'load' event firing on the next page load.
  // In Firefox versions that support sendBeacon, this doesn't matter, because
  // we'll use it instead of an image load for our final harvest.
  //
  // Some Safari versions never fire the 'unload' event for pages that are being
  // put into the WebKit page cache, so we *need* to use the pagehide event for
  // the final submission from Safari.
  //
  // Generally speaking, we will try to submit our final harvest from either
  // pagehide or unload, whichever comes first, but in Firefox, we need to avoid
  // attempting to submit from pagehide to ensure that we don't slow down loading
  // of the next page.
  if (!ffVersion || navigator.sendBeacon) {
    addE('pagehide', oneCall)
  } else {
    addE('beforeunload', oneCall)
  }
  addE('unload', oneCall)
}

},{}],26:[function(require,module,exports){
var canonicalFunctionNameRe = /([a-z0-9]+)$/i
function canonicalFunctionName (orig) {
  if (!orig) return

  var match = orig.match(canonicalFunctionNameRe)
  if (match) return match[1]

  return
}

module.exports = canonicalFunctionName

},{}],27:[function(require,module,exports){
// computeStackTrace: cross-browser stack traces in JavaScript
//
// Syntax:
//   s = computeStackTrace(exception) // consider using TraceKit.report instead
// Returns:
//   s.name              - exception name
//   s.message           - exception message
//   s.stack[i].url      - JavaScript or HTML file URL
//   s.stack[i].func     - function name, or empty for anonymous functions
//   s.stack[i].line     - line number, if known
//   s.stack[i].column   - column number, if known
//   s.stack[i].context  - an array of source code lines; the middle element corresponds to the correct line#
//   s.mode              - 'stack', 'stacktrace', 'multiline', 'callers', 'onerror', or 'failed' -- method used to collect the stack trace
//
// Supports:
//   - Firefox:  full stack trace with line numbers and unreliable column
//               number on top frame
//   - Opera 10: full stack trace with line and column numbers
//   - Opera 9-: full stack trace with line numbers
//   - Chrome:   full stack trace with line and column numbers
//   - Safari:   line and column number for the topmost stacktrace element
//               only
//   - IE:       no line numbers whatsoever

// Contents of Exception in various browsers.
//
// SAFARI:
// ex.message = Can't find variable: qq
// ex.line = 59
// ex.sourceId = 580238192
// ex.sourceURL = http://...
// ex.expressionBeginOffset = 96
// ex.expressionCaretOffset = 98
// ex.expressionEndOffset = 98
// ex.name = ReferenceError
//
// FIREFOX:
// ex.message = qq is not defined
// ex.fileName = http://...
// ex.lineNumber = 59
// ex.stack = ...stack trace... (see the example below)
// ex.name = ReferenceError
//
// CHROME:
// ex.message = qq is not defined
// ex.name = ReferenceError
// ex.type = not_defined
// ex.arguments = ['aa']
// ex.stack = ...stack trace...
//
// INTERNET EXPLORER:
// ex.message = ...
// ex.name = ReferenceError
//
// OPERA:
// ex.message = ...message... (see the example below)
// ex.name = ReferenceError
// ex.opera#sourceloc = 11  (pretty much useless, duplicates the info in ex.message)
// ex.stacktrace = n/a; see 'opera:config#UserPrefs|Exceptions Have Stacktrace'

var reduce = require(39)
var formatStackTrace = require(28)

var has = Object.prototype.hasOwnProperty
var debug = false

var classNameRegex = /function (.+?)\s*\(/
var chrome = /^\s*at (?:((?:\[object object\])?(?:[^(]*\([^)]*\))*[^()]*(?: \[as \S+\])?) )?\(?((?:file|http|https|chrome-extension):.*?)?:(\d+)(?::(\d+))?\)?\s*$/i
var gecko = /^\s*(?:(\S*|global code)(?:\(.*?\))?@)?((?:file|http|https|chrome|safari-extension).*?):(\d+)(?::(\d+))?\s*$/i
var chrome_eval = /^\s*at .+ \(eval at \S+ \((?:(?:file|http|https):[^)]+)?\)(?:, [^:]*:\d+:\d+)?\)$/i
var ie_eval = /^\s*at Function code \(Function code:\d+:\d+\)\s*/i

module.exports = computeStackTrace

function computeStackTrace (ex) {
  var stack = null

  try {
    // This must be tried first because Opera 10 *destroys*
    // its stacktrace property if you try to access the stack
    // property first!!
    stack = computeStackTraceFromStacktraceProp(ex)
    if (stack) {
      return stack
    }
  } catch (e) {
    if (debug) {
      throw e
    }
  }

  try {
    stack = computeStackTraceFromStackProp(ex)
    if (stack) {
      return stack
    }
  } catch (e) {
    if (debug) {
      throw e
    }
  }

  try {
    stack = computeStackTraceFromOperaMultiLineMessage(ex)
    if (stack) {
      return stack
    }
  } catch (e) {
    if (debug) {
      throw e
    }
  }

  try {
    stack = computeStackTraceBySourceAndLine(ex)
    if (stack) {
      return stack
    }
  } catch (e) {
    if (debug) {
      throw e
    }
  }

  try {
    stack = computeStackTraceWithMessageOnly(ex)
    if (stack) {
      return stack
    }
  } catch (e) {
    if (debug) {
      throw e
    }
  }

  return {
    'mode': 'failed',
    'stackString': '',
    'frames': []
  }
}

/**
 * Computes stack trace information from the stack property.
 * Chrome and Gecko use this property.
 * @param {Error} ex
 * @return {?Object.<string, *>} Stack trace information.
 */
function computeStackTraceFromStackProp (ex) {
  if (!ex.stack) {
    return null
  }

  var errorInfo = reduce(
    ex.stack.split('\n'),
    parseStackProp,
    {frames: [], stackLines: [], wrapperSeen: false}
  )

  if (!errorInfo.frames.length) return null

  return {
    'mode': 'stack',
    'name': ex.name || getClassName(ex),
    'message': ex.message,
    'stackString': formatStackTrace(errorInfo.stackLines),
    'frames': errorInfo.frames
  }
}

function parseStackProp (info, line) {
  var element = getElement(line)

  if (!element) {
    info.stackLines.push(line)
    return info
  }

  if (isWrapper(element.func)) info.wrapperSeen = true
  else info.stackLines.push(line)

  if (!info.wrapperSeen) info.frames.push(element)
  return info
}

function getElement (line) {
  var parts = line.match(gecko)
  if (!parts) parts = line.match(chrome)

  if (parts) {
    return ({
      'url': parts[2],
      'func': (parts[1] !== 'Anonymous function' && parts[1] !== 'global code' && parts[1]) || null,
      'line': +parts[3],
      'column': parts[4] ? +parts[4] : null
    })
  }

  if (line.match(chrome_eval) || line.match(ie_eval) || line === 'anonymous') {
    return { 'func': 'evaluated code' }
  }
}

function computeStackTraceBySourceAndLine (ex) {
  if (!('line' in ex)) return null

  var className = ex.name || getClassName(ex)

  // Safari does not provide a URL for errors in eval'd code
  if (!ex.sourceURL) {
    return ({
      'mode': 'sourceline',
      'name': className,
      'message': ex.message,
      'stackString': getClassName(ex) + ': ' + ex.message + '\n    in evaluated code',
      'frames': [{
        'func': 'evaluated code'
      }]
    })
  }

  var stackString = className + ': ' + ex.message + '\n    at ' + ex.sourceURL
  if (ex.line) {
    stackString += ':' + ex.line
    if (ex.column) {
      stackString += ':' + ex.column
    }
  }

  return ({
    'mode': 'sourceline',
    'name': className,
    'message': ex.message,
    'stackString': stackString,
    'frames': [{ 'url': ex.sourceURL,
      'line': ex.line,
      'column': ex.column
    }]
  })
}

function computeStackTraceWithMessageOnly (ex) {
  var className = ex.name || getClassName(ex)
  if (!className) return null

  return ({
    'mode': 'nameonly',
    'name': className,
    'message': ex.message,
    'stackString': className + ': ' + ex.message,
    'frames': []
  })
}

function getClassName (obj) {
  var results = classNameRegex.exec(String(obj.constructor))
  return (results && results.length > 1) ? results[1] : 'unknown'
}

function isWrapper (functionName) {
  return (functionName && functionName.indexOf('nrWrapper') >= 0)
}

// TODO: Stop supporting old opera and throw away:
// computeStackTraceFromStacktraceProp
// computeStackTraceFromOperaMultiLineMessage

/**
 * Computes stack trace information from the stacktrace property.
 * Opera 10 uses this property.
 * @param {Error} ex
 * @return {?Object.<string, *>} Stack trace information.
 */
function computeStackTraceFromStacktraceProp (ex) {
  if (!ex.stacktrace) {
    return null
  }

  // Access and store the stacktrace property before doing ANYTHING
  // else to it because Opera is not very good at providing it
  // reliably in other circumstances.
  var stacktrace = ex.stacktrace

  var testRE = / line (\d+), column (\d+) in (?:<anonymous function: ([^>]+)>|([^\)]+))\(.*\) in (.*):\s*$/i
  var lines = stacktrace.split('\n')
  var frames = []
  var stackLines = []
  var parts
  var wrapperSeen = false

  for (var i = 0, j = lines.length; i < j; i += 2) {
    if ((parts = testRE.exec(lines[i]))) {
      var element = {
        'line': +parts[1],
        'column': +parts[2],
        'func': parts[3] || parts[4],
        'url': parts[5]
      }

      if (isWrapper(element.func)) wrapperSeen = true
      else stackLines.push(lines[i])

      if (!wrapperSeen) frames.push(element)
    } else {
      stackLines.push(lines[i])
    }
  }

  if (!frames.length) {
    return null
  }

  return {
    'mode': 'stacktrace',
    'name': ex.name || getClassName(ex),
    'message': ex.message,
    'stackString': formatStackTrace(stackLines),
    'frames': frames
  }
}

/**
 * NOT TESTED.
 * Computes stack trace information from an error message that includes
 * the stack trace.
 * Opera 9 and earlier use this method if the option to show stack
 * traces is turned on in opera:config.
 * @param {Error} ex
 * @return {?Object.<string, *>} Stack information.
 */
function computeStackTraceFromOperaMultiLineMessage (ex) {
  // Opera includes a stack trace into the exception message. An example is:
  //
  // Statement on line 3: Undefined variable: undefinedFunc
  // Backtrace:
  //   Line 3 of linked script file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.js: In function zzz
  //         undefinedFunc(a)
  //   Line 7 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function yyy
  //           zzz(x, y, z)
  //   Line 3 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function xxx
  //           yyy(a, a, a)
  //   Line 1 of function script
  //     try { xxx('hi'); return false; } catch(ex) { TraceKit.report(ex); }
  //   ...

  var lines = ex.message.split('\n')
  if (lines.length < 4) {
    return null
  }

  var lineRE1 = /^\s*Line (\d+) of linked script ((?:file|http|https)\S+)(?:: in function (\S+))?\s*$/i
  var lineRE2 = /^\s*Line (\d+) of inline#(\d+) script in ((?:file|http|https)\S+)(?:: in function (\S+))?\s*$/i
  var lineRE3 = /^\s*Line (\d+) of function script\s*$/i
  var frames = []
  var stackLines = []
  var scripts = document.getElementsByTagName('script')
  var inlineScriptBlocks = []
  var parts
  var i
  var len
  var wrapperSeen = false

  for (i in scripts) {
    if (has.call(scripts, i) && !scripts[i].src) {
      inlineScriptBlocks.push(scripts[i])
    }
  }

  for (i = 2, len = lines.length; i < len; i += 2) {
    var item = null
    if ((parts = lineRE1.exec(lines[i]))) {
      item = {
        'url': parts[2],
        'func': parts[3],
        'line': +parts[1]
      }
    } else if ((parts = lineRE2.exec(lines[i]))) {
      item = {
        'url': parts[3],
        'func': parts[4]
      }
    } else if ((parts = lineRE3.exec(lines[i]))) {
      var url = window.location.href.replace(/#.*$/, '')
      var line = parts[1]

      item = {
        'url': url,
        'line': line,
        'func': ''
      }
    }

    if (item) {
      if (isWrapper(item.func)) wrapperSeen = true
      else stackLines.push(lines[i])

      if (!wrapperSeen) frames.push(item)
    }
  }
  if (!frames.length) {
    return null // could not parse multiline exception message as Opera stack trace
  }

  return {
    'mode': 'multiline',
    'name': ex.name || getClassName(ex),
    'message': lines[0],
    'stackString': formatStackTrace(stackLines),
    'frames': frames
  }
}

},{}],28:[function(require,module,exports){
var stripNewlinesRegex = /^\n+|\n+$/g

module.exports = function (stackLines) {
  var stackString
  if (stackLines.length > 100) {
    var truncatedLines = stackLines.length - 100
    stackString = stackLines.slice(0, 50).join('\n')
    stackString += '\n< ...truncated ' + truncatedLines + ' lines... >\n'
    stackString += stackLines.slice(-50).join('\n')
  } else {
    stackString = stackLines.join('\n')
  }
  return stackString.replace(stripNewlinesRegex, '')
}

},{}],29:[function(require,module,exports){
var agg = require(2)
var canonicalFunctionName = require(26)
var cleanURL = require(5)
var computeStackTrace = require(27)
var stringHashCode = require(30)
var loader = require("loader")
var ee = require("ee")
var stackReported = {}
var pageviewReported = {}
var register = require(17)
var harvest = require(9)
var interval = require(12)
var stringify = require(22)
var handle = require("handle")
var baseEE = require("ee")
var mapOwn = require(36)
var errorCache = {}

// Make sure loader.offset is as accurate as possible
require(20)

// bail if not instrumented
if (!loader.features.err) return
var errorOnPage = false

var harvestTimeSeconds = 60

harvest.on('jserrors', function () {
  var body = agg.take([ 'err', 'ierr' ])
  var payload = { body: body, qs: {} }
  var releaseIds = stringify(loader.releaseIds)

  if (releaseIds !== '{}') {
    payload.qs.ri = releaseIds
  }

  if (body && body.err && body.err.length && !errorOnPage) {
    payload.qs.pve = '1'
    errorOnPage = true
  }
  return payload
})

harvest.pingErrors(loader)

// send errors every minute
interval(function () {
  var sent = harvest.sendX('jserrors', loader)
  if (!sent) harvest.pingErrors(loader)
}, harvestTimeSeconds * 1000)

ee.on('feat-err', function () {
  register('err', storeError)
  register('ierr', storeError)
})

function nameHash (params) {
  return stringHashCode(params.exceptionClass) ^ params.stackHash
}

function canonicalizeURL (url, cleanedOrigin) {
  if (typeof url !== 'string') return ''

  var cleanedURL = cleanURL(url)
  if (cleanedURL === cleanedOrigin) {
    return '<inline>'
  } else {
    return cleanedURL
  }
}

function buildCanonicalStackString (stackInfo, cleanedOrigin) {
  var canonicalStack = ''

  for (var i = 0; i < stackInfo.frames.length; i++) {
    var frame = stackInfo.frames[i]
    var func = canonicalFunctionName(frame.func)

    if (canonicalStack) canonicalStack += '\n'
    if (func) canonicalStack += func + '@'
    if (typeof frame.url === 'string') canonicalStack += frame.url
    if (frame.line) canonicalStack += ':' + frame.line
  }

  return canonicalStack
}

// Strip query parameters and fragments from the stackString property of the
// given stackInfo, along with the 'url' properties of each frame in
// stackInfo.frames.
//
// Any URLs that are equivalent to the cleaned version of the origin will also
// be replaced with the string '<inline>'.
//
function canonicalizeStackURLs (stackInfo) {
  // Currently, loader.origin might contain a fragment, but we don't want to use it
  // for comparing with frame URLs.
  var cleanedOrigin = cleanURL(loader.origin)

  for (var i = 0; i < stackInfo.frames.length; i++) {
    var frame = stackInfo.frames[i]
    var originalURL = frame.url
    var cleanedURL = canonicalizeURL(originalURL, cleanedOrigin)
    if (cleanedURL && cleanedURL !== frame.url) {
      frame.url = cleanedURL
      stackInfo.stackString = stackInfo.stackString.split(originalURL).join(cleanedURL)
    }
  }

  return stackInfo
}

function storeError (err, time, internal, customAttributes) {
  // are we in an interaction
  time = time || loader.now()
  if (!internal && loader.onerror && loader.onerror(err)) return

  var stackInfo = canonicalizeStackURLs(computeStackTrace(err))
  var canonicalStack = buildCanonicalStackString(stackInfo)

  var params = {
    stackHash: stringHashCode(canonicalStack),
    exceptionClass: stackInfo.name,
    request_uri: window.location.pathname
  }
  if (stackInfo.message) {
    params.message = '' + stackInfo.message
  }

  if (!stackReported[params.stackHash]) {
    stackReported[params.stackHash] = true
    params.stack_trace = stackInfo.stackString
  } else {
    params.browser_stack_hash = stringHashCode(stackInfo.stackString)
  }
  params.releaseIds = stringify(loader.releaseIds)

  // When debugging stack canonicalization/hashing, uncomment these lines for
  // more output in the test logs
  // params.origStack = err.stack
  // params.canonicalStack = canonicalStack

  var hash = nameHash(params)

  if (!pageviewReported[hash]) {
    params.pageview = 1
    pageviewReported[hash] = true
  }

  var type = internal ? 'ierr' : 'err'
  var newMetrics = { time: time }

  // stn and spa aggregators listen to this event - stn sends the error in its payload,
  // and spa annotates the error with interaction info
  handle('errorAgg', [type, hash, params, newMetrics])

  if (params._interactionId != null) {
    // hold on to the error until the interaction finishes
    errorCache[params._interactionId] = errorCache[params._interactionId] || []
    errorCache[params._interactionId].push([type, hash, params, newMetrics, att, customAttributes])
  } else {
    // store custom attributes
    var customParams = {}
    var att = loader.info.jsAttributes
    mapOwn(att, setCustom)
    if (customAttributes) {
      mapOwn(customAttributes, setCustom)
    }

    var jsAttributesHash = stringHashCode(stringify(customParams))
    var aggregateHash = hash + ':' + jsAttributesHash
    agg.store(type, aggregateHash, params, newMetrics, customParams)
  }

  function setCustom (key, val) {
    customParams[key] = (val && typeof val === 'object' ? stringify(val) : val)
  }
}

baseEE.on('interactionSaved', function (interaction) {
  if (!errorCache[interaction.id]) return

  errorCache[interaction.id].forEach(function (item) {
    var customParams = {}
    var globalCustomParams = item[4]
    var localCustomParams = item[5]

    mapOwn(globalCustomParams, setCustom)
    mapOwn(interaction.root.attrs.custom, setCustom)
    mapOwn(localCustomParams, setCustom)

    var params = item[2]
    params.browserInteractionId = interaction.root.attrs.id
    delete params._interactionId

    if (params._interactionNodeId) {
      params.parentNodeId = params._interactionNodeId.toString()
      delete params._interactionNodeId
    }

    var hash = item[1] + interaction.root.attrs.id
    var jsAttributesHash = stringHashCode(stringify(customParams))
    var aggregateHash = hash + ':' + jsAttributesHash

    agg.store(item[0], aggregateHash, params, item[3], customParams)

    function setCustom (key, val) {
      customParams[key] = (val && typeof val === 'object' ? stringify(val) : val)
    }
  })
  delete errorCache[interaction.id]
})

baseEE.on('interactionDiscarded', function (interaction) {
  if (!errorCache[interaction.id]) return

  errorCache[interaction.id].forEach(function (item) {
    var customParams = {}
    var globalCustomParams = item[4]
    var localCustomParams = item[5]

    mapOwn(globalCustomParams, setCustom)
    mapOwn(interaction.root.attrs.custom, setCustom)
    mapOwn(localCustomParams, setCustom)

    var params = item[2]
    delete params._interactionId
    delete params._interactionNodeId

    var hash = item[1]
    var jsAttributesHash = stringHashCode(stringify(customParams))
    var aggregateHash = hash + ':' + jsAttributesHash

    agg.store(item[0], aggregateHash, item[2], item[3], customParams)

    function setCustom (key, val) {
      customParams[key] = (val && typeof val === 'object' ? stringify(val) : val)
    }
  })
  delete errorCache[interaction.id]
})

},{}],30:[function(require,module,exports){
function stringHashCode (string) {
  var hash = 0
  var charVal

  if (!string || !string.length) return hash
  for (var i = 0; i < string.length; i++) {
    charVal = string.charCodeAt(i)
    hash = ((hash << 5) - hash) + charVal
    hash = hash | 0 // Convert to 32bit integer
  }
  return hash
}

module.exports = stringHashCode

},{}],31:[function(require,module,exports){
var ee = require("ee")
var loader = require("loader")
var mapOwn = require(36)
var stringify = require(22)
var register = require(17)
var harvest = require(9)
var cleanURL = require(5)
var interval = require(12)

var eventsPerMinute = 120
var harvestTimeSeconds = 30
var eventsPerHarvest = eventsPerMinute * harvestTimeSeconds / 60
var referrerUrl

var events = []
var att = loader.info.jsAttributes = {}

if (document.referrer) referrerUrl = cleanURL(document.referrer)

register('api-setCustomAttribute', setCustomAttribute, 'api')

ee.on('feat-ins', function () {
  register('api-addPageAction', addPageAction)

  harvest.on('ins', function () {
    var payload = ({
      qs: {
        ua: loader.info.userAttributes,
        at: loader.info.atts
      },
      body: {
        ins: events
      }
    })
    events = []
    return payload
  })

  interval(function () {
    harvest.sendX('ins', loader)
  }, harvestTimeSeconds * 1000)

  harvest.sendX('ins', loader)
})

// WARNING: Insights times are in seconds. EXCEPT timestamp, which is in ms.
function addPageAction (t, name, attributes) {
  if (events.length >= eventsPerHarvest) return
  var width
  var height
  var eventAttributes = {}

  if (typeof window !== 'undefined' && window.document && window.document.documentElement) {
    // Doesn't include the nav bar when it disappears in mobile safari
    // https://github.com/jquery/jquery/blob/10399ddcf8a239acc27bdec9231b996b178224d3/src/dimensions.js#L23
    width = window.document.documentElement.clientWidth
    height = window.document.documentElement.clientHeight
  }

  var defaults = {
    timestamp: t + loader.offset,
    timeSinceLoad: t / 1000,
    browserWidth: width,
    browserHeight: height,
    referrerUrl: referrerUrl,
    currentUrl: cleanURL('' + location),
    pageUrl: cleanURL(loader.origin),
    eventType: 'PageAction'
  }

  mapOwn(defaults, set)
  mapOwn(att, set)
  if (attributes && typeof attributes === 'object') {
    mapOwn(attributes, set)
  }
  eventAttributes.actionName = name || ''

  events.push(eventAttributes)

  function set (key, val) {
    eventAttributes[key] = (val && typeof val === 'object' ? stringify(val) : val)
  }
}

function setCustomAttribute (t, key, value) {
  att[key] = value
}

},{}],32:[function(require,module,exports){
var loader = require("loader")
var registerHandler = require(17)
var harvest = require(9)
var mapOwn = require(36)
var reduce = require(39)
var stringify = require(22)
var slice = require(37)
var parseUrl = require(34)
var interval = require(12)

if (!harvest.xhrUsable || !loader.xhrWrappable) return

var ptid = ''
var ignoredEvents = {mouseup: true, mousedown: true}
var toAggregate = {
  typing: [1000, 2000],
  scrolling: [100, 1000],
  mousing: [1000, 2000],
  touching: [1000, 2000]
}

var rename = {
  typing: {
    keydown: true,
    keyup: true,
    keypress: true
  },
  mousing: {
    mousemove: true,
    mouseenter: true,
    mouseleave: true,
    mouseover: true,
    mouseout: true
  },
  scrolling: {
    scroll: true
  },
  touching: {
    touchstart: true,
    touchmove: true,
    touchend: true,
    touchcancel: true,
    touchenter: true,
    touchleave: true
  }
}

var trace = {}
var ee = require("ee")

// exports only used for testing
module.exports = {
  _takeSTNs: takeSTNs
}

// Make sure loader.offset is as accurate as possible
require(20)

// bail if not instrumented
if (!loader.features.stn) return

ee.on('feat-stn', function () {
  storeTiming(window.performance.timing)

  harvest.on('resources', checkPtid(takeSTNs))

  var xhr = harvest.sendX('resources', loader, { needResponse: true })

  xhr.addEventListener('load', function () {
    ptid = this.responseText
  }, false)

  registerHandler('bst', storeEvent)
  registerHandler('bstTimer', storeTimer)
  registerHandler('bstResource', storeResources)
  registerHandler('bstHist', storeHist)
  registerHandler('bstXhrAgg', storeXhrAgg)
  registerHandler('bstApi', storeSTN)
  registerHandler('errorAgg', storeErrorAgg)

  interval(function () {
    var total = 0
    if ((loader.now()) > (15 * 60 * 1000)) {
      // been collecting for over 15 min, empty trace object and bail
      trace = {}
      return
    }

    mapOwn(trace, function (name, nodes) {
      if (nodes && nodes.length) total += nodes.length
    })

    if (total > 30) harvest.sendX('resources', loader)
    // if harvests aren't working (due to no ptid),
    // start throwing things away at 1000 nodes.
    if (total > 1000) trace = {}
  }, 10000)
})

function storeTiming (_t) {
  var key
  var val
  var timeOffset
  var now = Date.now()

  // loop iterates through prototype also (for FF)
  for (key in _t) {
    val = _t[key]

    // ignore inherited methods, meaningless 0 values, and bogus timestamps
    // that are in the future (Microsoft Edge seems to sometimes produce these)
    if (!(typeof (val) === 'number' && val > 0 && val < now)) continue

    timeOffset = _t[key] - loader.offset

    storeSTN({
      n: key,
      s: timeOffset,
      e: timeOffset,
      o: 'document',
      t: 'timing'
    })
  }
}

function storeTimer (target, start, end, type) {
  var category = 'timer'
  if (type === 'requestAnimationFrame') category = type

  var evt = {
    n: type,
    s: start,
    e: end,
    o: 'window',
    t: category
  }

  storeSTN(evt)
}

function storeEvent (currentEvent, target, start, end) {
  // we find that certain events make the data too noisy to be useful
  if (currentEvent.type in ignoredEvents) { return false }

  var evt = {
    n: evtName(currentEvent.type),
    s: start,
    e: end,
    t: 'event'
  }

  try {
    // webcomponents-lite.js can trigger an exception on currentEvent.target getter because
    // it does not check currentEvent.currentTarget before calling getRootNode() on it
    evt.o = evtOrigin(currentEvent.target, target)
  } catch (e) {
    evt.o = evtOrigin(null, target)
  }

  storeSTN(evt)
}

function evtName (type) {
  var name = type

  mapOwn(rename, function (key, val) {
    if (type in val) name = key
  })

  return name
}

function evtOrigin (t, target) {
  var origin = 'unknown'

  if (t && t instanceof XMLHttpRequest) {
    var params = ee.context(t).params
    origin = params.status + ' ' + params.method + ': ' + params.host + params.pathname
  } else if (t && typeof (t.tagName) === 'string') {
    origin = t.tagName.toLowerCase()
    if (t.id) origin += '#' + t.id
    if (t.className) origin += '.' + slice(t.classList).join('.')
  }

  if (origin === 'unknown') {
    if (target === document) origin = 'document'
    else if (target === window) origin = 'window'
    else if (target instanceof FileReader) origin = 'FileReader'
  }

  return origin
}

function storeHist (path, old, time) {
  var node = {
    n: 'history.pushState',
    s: time,
    e: time,
    o: path,
    t: old
  }

  storeSTN(node)
}

var laststart = 0

function storeResources (resources) {
  resources.forEach(function (currentResource) {
    var parsed = parseUrl(currentResource.name)
    var res = {
      n: currentResource.initiatorType,
      s: currentResource.fetchStart | 0,
      e: currentResource.responseEnd | 0,
      o: parsed.protocol + '://' + parsed.hostname + ':' + parsed.port + parsed.pathname, // resource.name is actually a URL so it's the source
      t: currentResource.entryType
    }

    // don't recollect old resources
    if (res.s < laststart) return

    laststart = res.s

    storeSTN(res)
  })
}

function storeErrorAgg (type, name, params, metrics) {
  if (type !== 'err') return
  var node = {
    n: 'error',
    s: metrics.time,
    e: metrics.time,
    o: params.message,
    t: params.stackHash
  }
  storeSTN(node)
}

function storeXhrAgg (type, name, params, metrics) {
  if (type !== 'xhr') return
  var node = {
    n: 'Ajax',
    s: metrics.time,
    e: metrics.time + metrics.duration,
    o: params.status + ' ' + params.method + ': ' + params.host + params.pathname,
    t: 'ajax'
  }
  storeSTN(node)
}

function storeSTN (stn) {
  var traceArr = trace[stn.n]
  if (!traceArr) traceArr = trace[stn.n] = []

  traceArr.push(stn)
}

function checkPtid (fn) {
  var first = true
  return function () {
    if (!(first || ptid)) return {} // only report w/o ptid during first cycle.
    first = false
    return fn()
  }
}

function takeSTNs () {
  storeResources(window.performance.getEntriesByType('resource'))
  var stns = reduce(mapOwn(trace, function (name, nodes) {
    if (!(name in toAggregate)) return nodes

    return reduce(mapOwn(reduce(nodes.sort(byStart), smearEvtsByOrigin(name), {}), val), flatten, [])
  }), flatten, [])

  if (stns.length === 0) return {}
  else trace = {}
  var stnInfo = {
    qs: {st: '' + loader.offset, ptid: ptid},
    body: {res: stns}
  }

  if (!ptid) {
    stnInfo.qs.ua = loader.info.userAttributes
    stnInfo.qs.at = loader.info.atts
    var ja = stringify(loader.info.jsAttributes)
    stnInfo.qs.ja = ja === '{}' ? null : ja
  }
  return stnInfo
}

function byStart (a, b) {
  return a.s - b.s
}

function smearEvtsByOrigin (name) {
  var maxGap = toAggregate[name][0]
  var maxLen = toAggregate[name][1]
  var lastO = {}

  return function (byOrigin, evt) {
    var lastArr = byOrigin[evt.o]

    lastArr || (lastArr = byOrigin[evt.o] = [])

    var last = lastO[evt.o]

    if (name === 'scrolling' && !trivial(evt)) {
      lastO[evt.o] = null
      evt.n = 'scroll'
      lastArr.push(evt)
    } else if (last && (evt.s - last.s) < maxLen && last.e > (evt.s - maxGap)) {
      last.e = evt.e
    } else {
      lastO[evt.o] = evt
      lastArr.push(evt)
    }

    return byOrigin
  }
}

function val (key, value) {
  return value
}

function flatten (a, b) {
  return a.concat(b)
}

function trivial (node) {
  var limit = 4
  if (node && typeof node.e === 'number' && typeof node.s === 'number' && (node.e - node.s) < limit) return true
  else return false
}

},{}],33:[function(require,module,exports){
var agg = require(2)
var register = require(17)
var harvest = require(9)
var stringify = require(22)
var loader = require("loader")
var ee = require("ee")
var handle = require("handle")

// bail if not instrumented
if (!loader.features.xhr) return

harvest.on('jserrors', function () {
  return { body: agg.take([ 'xhr' ]) }
})

ee.on('feat-err', function () { register('xhr', storeXhr) })

module.exports = storeXhr

function storeXhr (params, metrics, start) {
  metrics.time = start

  var type = 'xhr'
  var hash
  if (params.cat) {
    hash = stringify([params.status, params.cat])
  } else {
    hash = stringify([params.status, params.host, params.pathname])
  }

  handle('bstXhrAgg', [type, hash, params, metrics])
  agg.store(type, hash, params, metrics)
}

},{}],34:[function(require,module,exports){
var stringsToParsedUrls = {}

module.exports = function parseUrl (url) {
  if (url in stringsToParsedUrls) {
    return stringsToParsedUrls[url]
  }

  var urlEl = document.createElement('a')
  var location = window.location
  var ret = {}

  // Use an anchor dom element to resolve the url natively.
  urlEl.href = url

  ret.port = urlEl.port

  var firstSplit = urlEl.href.split('://')

  if (!ret.port && firstSplit[1]) {
    ret.port = firstSplit[1].split('/')[0].split('@').pop().split(':')[1]
  }
  if (!ret.port || ret.port === '0') ret.port = (firstSplit[0] === 'https' ? '443' : '80')

  // Host not provided in IE for relative urls
  ret.hostname = (urlEl.hostname || location.hostname)

  ret.pathname = urlEl.pathname

  ret.protocol = firstSplit[0]

  // Pathname sometimes doesn't have leading slash (IE 8 and 9)
  if (ret.pathname.charAt(0) !== '/') ret.pathname = '/' + ret.pathname

  // urlEl.protocol is ':' in old ie when protocol is not specified
  var sameProtocol = !urlEl.protocol || urlEl.protocol === ':' || urlEl.protocol === location.protocol
  var sameDomain = urlEl.hostname === document.domain && urlEl.port === location.port

  // urlEl.hostname is not provided by IE for relative urls, but relative urls are also same-origin
  ret.sameOrigin = sameProtocol && (!urlEl.hostname || sameDomain)

  // Only cache if url doesn't have a path
  if (ret.pathname === '/') {
    stringsToParsedUrls[url] = ret
  }

  return ret
}

},{}],35:[function(require,module,exports){
var ffVersion = 0
var match = navigator.userAgent.match(/Firefox[\/\s](\d+\.\d+)/)
if (match) ffVersion = +match[1]

module.exports = ffVersion

},{}],36:[function(require,module,exports){
var has = Object.prototype.hasOwnProperty

module.exports = mapOwn

function mapOwn (obj, fn) {
  var results = []
  var key = ''
  var i = 0

  for (key in obj) {
    if (has.call(obj, key)) {
      results[i] = fn(key, obj[key])
      i += 1
    }
  }

  return results
}

},{}],37:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * Slices the `collection` from the `start` index up to, but not including,
 * the `end` index.
 *
 * Note: This function is used instead of `Array#slice` to support node lists
 * in IE < 9 and to ensure dense arrays are returned.
 *
 * @private
 * @param {Array|Object|string} collection The collection to slice.
 * @param {number} start The start index.
 * @param {number} end The end index.
 * @returns {Array} Returns the new array.
 */
function slice(array, start, end) {
  start || (start = 0);
  if (typeof end == 'undefined') {
    end = array ? array.length : 0;
  }
  var index = -1,
      length = end - start || 0,
      result = Array(length < 0 ? 0 : length);

  while (++index < length) {
    result[index] = array[start + index];
  }
  return result;
}

module.exports = slice;

},{}],38:[function(require,module,exports){
module.exports = {
  exists: typeof (window.performance) !== 'undefined' && window.performance.timing && typeof (window.performance.timing.navigationStart) !== 'undefined'
}

},{}],39:[function(require,module,exports){
module.exports = reduce

function reduce (arr, fn, next) {
  var i = 0
  if (typeof next === 'undefined') {
    next = arr[0]
    i = 1
  }

  for (i; i < arr.length; i++) {
    next = fn(next, arr[i])
  }

  return next
}

},{}]},{},[29,33,32,31,11])

