var window = global;

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

function stringify (val) {
  try {
    return str('', {'': val})
  } catch (e) {
    throw e; //
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




var MAX_ATTRIBUTES = 64;
var hasOwnProp = Object.prototype.hasOwnProperty;
var has = Object.prototype.hasOwnProperty;

function mapOwn (obj, fn) {
  var results = [];
  var key = '';
  var i = 0;

  for (key in obj) {
    if (has.call(obj, key)) {
      results[i] = fn(key, obj[key]);
      i += 1;
    }
  }

  return results;
}

var escapable = /([,\\;])/g;

function quoteString (str) {
  return "'" + str.replace(escapable, '\\$1');
}

function nullable (val, fn, comma) {
  return val || val === 0 || val === ''
    ? fn(val) + (comma ? ',' : '')
    : '!';
}

function numeric (n, noDefault) {
  if (noDefault) {
    return Math.floor(n).toString(36);
  }
  return (n === undefined || n === 0) ? '' : Math.floor(n).toString(36);
}

function getAddStringContext () {
  var stringTable = Object.hasOwnProperty('create') ? Object.create(null) : {};
  var stringTableIdx = 0;

  return addString;

  function addString(str) {
    if (typeof str === 'undefined' || str === '') return '';
    str = String(str);
    if (hasOwnProp.call(stringTable, str)) {
      return numeric(stringTable[str], true);
    } else {
      stringTable[str] = stringTableIdx++;
      return quoteString(str);
    }
  }
}

function addCustomAttributes (attrs, addString) {
  var attrParts = [];

  mapOwn(attrs, function (key, val) {
    if (attrParts.length >= MAX_ATTRIBUTES) return
    var type = 5;
    var serializedValue;
    // add key to string table first
    key = addString(key);

    switch (typeof val) {
    case 'object':
      if (val) {
        // serialize objects to strings
        serializedValue = addString(stringify(val));
      } else {
        // null attribute type
        type = 9;
      }
      break;
      case 'number':
      type = 6;
        // make sure numbers contain a `.` so they are parsed as doubles
      serializedValue = val % 1 ? val : val + '.';
      break;
      case 'boolean':
      type = val ? 7 : 8;
      break;
      case 'undefined':
        // we treat undefined as a null attribute (since dirac does not have a concept of undefined)
      type = 9;
      break;
      default:
      serializedValue = addString(val);
    }

    attrParts.push([type, key + (serializedValue ? ',' + serializedValue : '')]);
  });

  return attrParts;
}

function getPayload(data) {
  var addString = getAddStringContext();

  var payload = 'bel.6;';

  for (var i = 0; i < data.length; i++) {
    var timing = data[i];

    payload += 'e,';
    payload += addString(timing.name) + ',';
    payload += nullable(timing.value, numeric, false) + ',';

    //appendGlobalCustomAttributes(timing)

    var attrParts = addCustomAttributes(timing.attrs, addString);
    if (attrParts && attrParts.length > 0) {
      payload += numeric(attrParts.length) + ';' + attrParts.join(';');
    }

    if ((i + 1) < data.length) payload += ';';
  }

  return payload;
}

[
  [{name: "key", value: 1000}],
  [{name: "key", value: 0}], // внезапно пустая строка вместо 0
  [{name: "key"}],
  [{name: "a,b,c"}],
  [{name: "a;b;c"}],
  [{name: "key"}, {name: "key"}], // номера вместо дублей
  [{name: "key", value: 1, attrs: {a: 2}}],
  [{name: "key", value: 1, attrs: {a: 2, b: 3}}],
  [{name: "key", value: 1, attrs: {key: 2}}], // дубль
  [{name: "key", value: 1, attrs: {a: 0.8234}}],
  [{name: "key", value: 1, attrs: {bar: "str"}}],
  [{name: "key", value: 1, attrs: {bar: "key"}}],
  // и тут наверняка еще случаи с эскейпингом объектов есть
  [{name: "key", value: 1, attrs: {bar: {foo: 1}}}],
  [{name: "key", value: 1, attrs: {bar: {foo: "123,34"}}}],
  [{name: "key", value: 1, attrs: {bar: {foo: "123;34"}}}],
  [{name: "key", value: 1, attrs: {bar: {a: 1, b: 1000}}}],
  [{name: "key", value: 1, attrs: {bar: false}}],
  [{name: "key", value: 1, attrs: {bar: true}}],
  [{name: "key", value: 1, attrs: {bar: undefined}}],
].forEach(data => {
  console.log( JSON.stringify(data), getPayload(data) );
});


/*
[{"name":"key","value":1000}] bel.6;e,'key,rs,
[{"name":"key","value":0}] bel.6;e,'key,,
[{"name":"key"}] bel.6;e,'key,!,
[{"name":"a,b,c"}] bel.6;e,'a\,b\,c,!,
[{"name":"a;b;c"}] bel.6;e,'a\;b\;c,!,
[{"name":"key"},{"name":"key"}] bel.6;e,'key,!,;e,0,!,
[{"name":"key","value":1,"attrs":{"a":2}}] bel.6;e,'key,1,1;6,'a,2.
[{"name":"key","value":1,"attrs":{"a":2,"b":3}}] bel.6;e,'key,1,2;6,'a,2.;6,'b,3.
[{"name":"key","value":1,"attrs":{"key":2}}] bel.6;e,'key,1,1;6,0,2.
[{"name":"key","value":1,"attrs":{"a":0.8234}}] bel.6;e,'key,1,1;6,'a,0.8234
[{"name":"key","value":1,"attrs":{"bar":"str"}}] bel.6;e,'key,1,1;5,'bar,'str
[{"name":"key","value":1,"attrs":{"bar":"key"}}] bel.6;e,'key,1,1;5,'bar,0
[{"name":"key","value":1,"attrs":{"bar":{"foo":1}}}] bel.6;e,'key,1,1;5,'bar,'{"foo":1}
[{"name":"key","value":1,"attrs":{"bar":{"foo":"123,34"}}}] bel.6;e,'key,1,1;5,'bar,'{"foo":"123\\u002c34"}
[{"name":"key","value":1,"attrs":{"bar":{"foo":"123;34"}}}] bel.6;e,'key,1,1;5,'bar,'{"foo":"123\\u003b34"}
[{"name":"key","value":1,"attrs":{"bar":{"a":1,"b":1000}}}] bel.6;e,'key,1,1;5,'bar,'{"a":1\,"b":1000}
[{"name":"key","value":1,"attrs":{"bar":false}}] bel.6;e,'key,1,1;8,'bar
[{"name":"key","value":1,"attrs":{"bar":true}}] bel.6;e,'key,1,1;7,'bar
[{"name":"key","value":1,"attrs":{}}] bel.6;e,'key,1,1;9,'bar
*/
