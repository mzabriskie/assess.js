!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.assess=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(_dereq_,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(_dereq_,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = _dereq_('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = _dereq_('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,_dereq_("JkpR2F"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":4,"JkpR2F":3,"inherits":2}],6:[function(_dereq_,module,exports){
function Assert(assertions, callback, interim, success, failure) {
	this.assertions = assertions;
	this.callback = callback;
	this.interim = interim;
	this.success = success;
	this.failure = failure;
}

Assert.prototype.testAll = function () {
	var result = true;
	for (var i=0, l=this.assertions.length; i<l; i++) {
		if (!this.test(i)) {
			result = false;
			break;
		}
	}
	return result;
};

Assert.prototype.test = function (index) {
	var assertion = this.assertions[index],
		input = Array.isArray(assertion.input) ? assertion.input : [assertion.input],
		output = null,
		result = false;

	try {
		this.interim.apply(null, input);
		output = this.callback.apply(null, input);
		if (!compare(output, assertion.output)) {
			throw new Error();
		} else {
			this.success.call(null, index, output);
			result = true;
		}
	} catch (e) {
		this.failure.call(null, index, assertion.output, output);
	}

	return result;
};

function compare(val1, val2) {
	if (Array.isArray(val1) && Array.isArray(val2)) {
		return compareArray(val1, val2);
	}
	else if (typeof val1 === 'object' && typeof val2 === 'object') {
		return compareObject(val1, val2);
	}
	else {
		return val1 === val2;
	}
}

function compareArray(arr1, arr2) {
	if (arr1.length !== arr2.length) {
		return false;
	}

	for (var i=0, l=arr1.length; i<l; i++) {
		if (!compare(arr1[i], arr2[i])) {
			return false;
		}
	}

	return true;
}

function compareObject(obj1, obj2) {
	if (obj1 === null && obj2 === null) {
		return true;
	}

	var keys1 = Object.keys(obj1),
		keys2 = Object.keys(obj2);

	if (!compareArray(keys1, keys2)) {
		return false;
	}

	for (var i=0, l=keys1.length; i<l; i++) {
		var key = keys1[i];
		if (!compare(obj1[key], obj2[key])) {
			return false;
		}
	}

	return true;
}

module.exports = Assert;
},{}],7:[function(_dereq_,module,exports){
module.exports = function () {
	'use strict';

	var Router = _dereq_('./router'),
		Timer = _dereq_('./timer'),
		Assert = _dereq_('./assert'),
		State = _dereq_('./state'),
		Console = _dereq_('./console');

	// Cache compiled templates and render to container
	var templates = {},
		container = document.getElementById('container');
	function renderContent(templateID, context) {
		if (typeof templates[templateID] === 'undefined') {
			var source = document.getElementById(templateID).innerHTML;
			templates[templateID] = Handlebars.compile(source);
		}

		container.innerHTML = templates[templateID](context);
	}

	// Format duration of time in milliseconds
	function duration(timeInMillis) {
		var intervals = {
				'm': 60000,
				's': 1000
			},
			sb = '';

		var k, v, unit;
		for (k in intervals) {
			if (!intervals.hasOwnProperty(k)) continue;

			v = intervals[k];
			unit = Math.floor(timeInMillis / v);
			timeInMillis %= v;

			if (sb.length > 0) sb += ':';
			if (unit < 10) unit = '0' + unit;
			sb += unit;
		}
		return sb;
	}

	// Handle meta + Enter
	function handleMetaEnter(f) {
		return function (e) {
			var isMac = navigator.platform.indexOf('Mac') > -1;
			if (e.keyCode === 13 && (isMac ? e.metaKey === true : e.ctrlKey === true)) {
				if (typeof e.stop === 'function') {
					e.stop();
				}
				if (typeof e.preventDefault === 'function') {
					e.preventDefault();
				}
				if (typeof f === 'function') {
					f();
				}
			}
		};
	}

	// Get next button action labels
	function getNextActionLabels(index, questions) {
		var button, console;

		if (index + 1 < questions.length) {
			button = 'Next';
			console = 'Click Next to continue to the next question.';
		} else {
			button = 'Finish';
			console = 'Click Finish to see your results.';
		}

		return {
			button: button,
			console: console
		};
	}

	// Handlebars helper to support math operations on @index
	// http://jsfiddle.net/mpetrovich/wMmHS/
	Handlebars.registerHelper('math', function(lvalue, operator, rvalue, options) {
		if (arguments.length < 4) {
			// Operator omitted, assuming "+"
			rvalue = operator;
			operator = '+';
		}

		lvalue = parseFloat(lvalue);
		rvalue = parseFloat(rvalue);

		return {
			'+': lvalue + rvalue,
			'-': lvalue - rvalue,
			'*': lvalue * rvalue,
			'/': lvalue / rvalue,
			'%': lvalue % rvalue
		}[operator];
	});

	// Handlebars helper to support simple Markdown
	Handlebars.registerHelper('markdown', function (text) {
		return new Handlebars.SafeString(text.replace(/`(.*?)`/g, '<code>$1</code>'));
	});

	// Handlebars helper to pluralize
	Handlebars.registerHelper('pluralize', function (count, singular, plural) {
		return count > 1 ? plural : singular;
	});

	var timer = null,
		interval = null,
		standardConsole = window.console;

	var assess = {
		init: function (questions) {
			State.init();

			var router = new Router()
				.when('/', function () {
					renderContent('home-template');

					document.getElementById('start').onclick = function () {
						this.redirect('/q/1');
					}.bind(this);
				})
				.when('/results', function () {
					var qs = [];
					for (var i=0, l=questions.length; i<l; i++) {
						var q = questions[i],
							s = State.getQuestion(i+1);
						qs[i] = {
							name: q.name,
							description: q.description,
							attempts: s.attempts,
							lapsed: duration(s.lapsed)
						};
					}

					renderContent('results-template', {lapsed: duration(State.getLapsedTime()), questions: qs});
				})
				.when('/q/:ID', {
					controller: function (ID) {
						var index = parseInt(ID, 10) - 1,
							hash = null;

						// Validate requested hash
						if (index < 0) {
							hash = '/q/1';
						} else if (index >= questions.length) {
							hash = '/q/' + questions.length;
						}

						if (hash !== null) {
							this.redirect(hash);
							return;
						}

						// Render tempalte
						renderContent('question-template', {
							question: questions[index],
							progress: {
								current: (index+1),
								total: questions.length
							}
						});

						// Hijack console
						window.console = new Console(document.getElementById('console'));

						var button = document.getElementById('submit');

						// Initialize Question
						var q = State.getQuestion(ID);
						State.setQuestion(q);

						// Check Read Only state
						var readOnly = q.completed;
						if (q.solution) {
							document.getElementById('code').value = q.solution;
						}

						// Initialize CodeMirror, Timer, and Assert
						var callback = null,
							code, assert;

						code = CodeMirror.fromTextArea(document.getElementById('code'), {
							lineNumbers: true,
							matchBrackets: true,
							readOnly: readOnly
						});

						// Helper functions
						function updateLapsedTime() {
							q.lapsed = timer.lapsed;
							State.setQuestion(q);

							document.getElementById('timer').innerHTML = duration(State.getLapsedTime());
						}

						function updateSolution() {
							q.solution = code.getValue();
							State.setQuestion(q);
						}

						function handleSubmitClick() {
							button.disabled = true;
							timer.stop();

							q.attempts += 1;
							State.setQuestion(q);

							// TODO: Gotta be something better than using eval
							if (typeof questions[index].callback === 'function') {
								/*jshint evil:true*/
								eval(code.getValue());
								callback = questions[index].callback;
							} else {
								/*jshint evil:true*/
								eval('callback = ' + code.getValue());
							}

							button.disabled = false;

							if (!assert.testAll()) {
								timer.start();
							} else {
								q.completed = true;
								updateSolution();

								var labels = getNextActionLabels(index, questions);
								assess.log('Nice work! ' + labels.console, 'info');

								// Update submit click handler to redirect to next screen
								button.innerHTML = labels.button;
								button.onclick = handleNextClick;
								window.onkeydown = handleMetaEnter(handleNextClick);
							}
						}

						function handleNextClick() {
							var hash = '';
							if (index + 1 < questions.length) {
								hash = '/q/' + (index + 2);
							} else {
								hash = '/results';
							}
							router.redirect(hash);
						}

						// Sync solution on interval
						interval = setInterval(updateSolution, 250);

						// Only hook up assert and timer if solution hasn't already been provided
						if (!readOnly) {
							timer = new Timer().start();
							timer.lapsed = q.lapsed;

							assert = new Assert(questions[index].test,
													function () { return callback.apply(null, arguments); },
													function () { assess.log('Testing input "' + arguments[0] + '"...'); },
													function () { assess.log(arguments[1] + ' is correct.', 'pass'); },
													function () { assess.log('Expected ' + arguments[1] + ' but got ' + arguments[2], 'error'); });

							// Update lapsed time
							timer.on('tick', updateLapsedTime);
							updateLapsedTime();

							// Handle Done! click
							button.onclick = handleSubmitClick;
							window.onkeydown = handleMetaEnter(handleSubmitClick);
						} else {
							var labels = getNextActionLabels(index, questions);

							// Update lapsed time
							document.getElementById('timer').innerHTML = duration(State.getLapsedTime());

							// Handle Next click
							button.innerHTML = labels.button;
							button.onclick = handleNextClick;
							window.onkeydown = handleMetaEnter(handleNextClick);

							// Log instructions
							document.getElementById('console').innerHTML = '';
							assess.log(labels.console, 'info');
						}
					},
					beforeunload: function () {
						if (timer) {
							timer.stop();
						}
						if (interval) {
							clearTimeout(interval);
						}

						// Restore console
						window.console = standardConsole;

						document.getElementById('submit').onclick = null;
						window.onkeydown = null;
					}
				})
				.otherwise(function () { renderContent('404-template'); })
				.process();

			return this;
		},
		log: function (message, type) {
			console.__log(message, type);
		}
	};

	return assess;
};
},{"./assert":6,"./console":8,"./router":9,"./state":10,"./timer":11}],8:[function(_dereq_,module,exports){
(function () {
	function join(args) {
		var message = [];
		for (var i=0, l=args.length; i<l; i++) {
			message.push(args[i]);
		}
		return message.join(' ');
	}

	function Console(element) {
		this.outlet = element;
	}

	Console.prototype.__log = function (message, type) {
		var el = document.createElement('div'),
			img = document.createElement('img');

		img.src = '/assets/img/px.png';
		el.appendChild(img);
		el.appendChild(document.createTextNode(message));

		if (typeof type !== 'undefined') {
			el.className = type;
		}
		this.outlet.appendChild(el);
		this.outlet.scrollTop = this.outlet.scrollHeight;
	};

	Console.prototype.__notimpl = function () {
		this.__log('Not implemented', 'error');
	};

	Console.prototype.log = function () {
		this.__log(join(arguments));
	};

	Console.prototype.assert = function (expression, message) {
		if (!expression) {
			this.__log(message, 'error');
		}
	};

	Console.prototype.clear = function () {
		this.outlet.innerHTML = '';
	};

	Console.prototype.count = function (label) {
		if (typeof this.__counter === 'undefined') {
			this.__counter = {};
		}
		if (typeof this.__counter[label] === 'undefined') {
			this.__counter[label] = 0;
		}

		this.__counter[label]++;

		this.__log(label + ': ' + this.__counter[label]);
	};

	Console.prototype.debug = Console.prototype.log;
	Console.prototype.dir = Console.prototype.__notimpl;
	Console.prototype.dirxml = Console.prototype.__notimpl;

	Console.prototype.error = function () {
		this.__log(join(arguments), 'error');
	};

	Console.prototype.group = Console.prototype.__notimpl;
	Console.prototype.groupCollapsed = Console.prototype.__notimpl;
	Console.prototype.groupEnd = Console.prototype.__notimpl;

	Console.prototype.info = function () {
		this.__log(join(arguments), 'info');
	};

	Console.prototype.profile = Console.prototype.__notimpl;
	Console.prototype.profileEnd = Console.prototype.__notimpl;

	Console.prototype.time = function (label) {
		if (typeof this.__timer === 'undefined') {
			this.__timer = {};
		}

		this.__timer[label] = Date.now();
	};

	Console.prototype.timeEnd = function (label) {
		var now = Date.now();
		if (typeof this.__timer !== 'undefined' &&
			typeof this.__timer[label] !== 'undefined') {
			this.__log(label + ': ' + (now - this.__timer[label] + 'ms'));
			delete this.__timer[label];
		}
	};

	Console.prototype.timeline = Console.prototype.__notimpl;
	Console.prototype.timelineEnd = Console.prototype.__notimpl;
	Console.prototype.timeStamp = Console.prototype.__notimpl;
	Console.prototype.trace = Console.prototype.__notimpl;

	Console.prototype.warn = function () {
		this.__log(join(arguments), 'warn');
	};

	if (typeof module !== 'undefined') {
		module.exports = Console;
	} else {
		this.Console = Console;
	}
}).call(this);
},{}],9:[function(_dereq_,module,exports){
(function () {

// Facade for adding DOM events
function addEvent(el, event, handler) {
	if (el.attachEvent) {
		el.attachEvent('on' + event, handler);
	} else if (el.addEventListener) {
		el.addEventListener(event, handler, true);
	} else {
		el['on' + event] = handler;
	}
}

// Provide function binding for browsers that lack support (IE<9)
if (typeof Function.prototype.bind !== 'function') {
	Function.prototype.bind = function (instance) {
		var method = this;
		return function () { method.apply(instance, arguments); };
	};
}

// Trim whitespace from a string value
function trim(str) {
	return str ? String(str).replace(/\s+/g, '') : '';
}

// Normalize the hash
function normalize(hash) {
	hash = trim(hash);
	if (hash.indexOf('#') === 0) {
		hash = hash.substring(1);
	}
	if (hash.indexOf('/') !== 0) {
		hash = '/' + hash;
	}
	return hash;
}

// Simple router for handling hash changes
function Router() {
	this.routes = {};
	this.fallback = null;

	addEvent(window, 'hashchange', function () {
		this.process(this.hash());
	}.bind(this));
}

Router.prototype.hash = function () {
	return window.location.hash.replace(/^#?/, '');
};

Router.prototype.redirect = function (hash) {
	window.location.hash = normalize(hash);

	return this;
};

Router.prototype.when = function (hash, controller) {
	hash = normalize(hash);

	var pattern = hash.replace(/\/(:[^\/]*)/g, '/([^\/]*)'),
		route = typeof controller === 'object' ? controller : { controller: controller };

	route.pattern = (hash === pattern) ? null : new RegExp('^' + pattern + '$');
	this.routes[hash] = route;

	return this;
};

Router.prototype.otherwise = function (controller) {
	this.current = null;
	this.fallback = controller;
	return this;
};

Router.prototype.process = function (hash) {
	if (typeof hash === 'undefined') {
		hash = this.hash();
	}
	hash = normalize(hash);

	// Don't handle hash if it hasn't changed
	if (this.current && this.current.hash === hash) {
		return this;
	}

	// Find the route from hash
	var route = this.routes[''],
		args = null;
	if (hash.length > 0) {
		// Exact hash match
		if (typeof this.routes[hash] !== 'undefined') {
			route = this.routes[hash];
		}
		// Find hash matching pattern
		else {
			for (var k in this.routes) {
				if (!this.routes.hasOwnProperty(k) ||
					this.routes[k].pattern === null) {
					continue;
				}

				var match = hash.match(this.routes[k].pattern);
				if (match) {
					args = match.splice(1, match.length - 1);
					route = this.routes[k];
					break;
				}
			}
		}
	}

	// Handle before unload if current route specified a handler
	if (this.current && typeof this.current.route.beforeunload === 'function') {
		// Provide stoppable event
		var event = {
			stopped: false,
			stop: function () {
				this.stopped = true;
			}
		};

		this.current.route.beforeunload.call(this, event);

		// If event was stopped, reset hash
		if (event.stopped) {
			window.history.back();
			return this;
		}
	}

	// Reset current route
	this.current = null;

	// Invoke matching route, if any
	if (typeof route !== 'undefined' && typeof route.controller === 'function') {
		route.controller.apply(this, args);

		// Update current route
		this.current = {
			hash: hash,
			route: route
		};
	}
	// Invoke fallback, if any
	else if (typeof this.fallback === 'function') {
		this.fallback.call(this, hash);
	}

	return this;
};

if (typeof module !== 'undefined') {
	module.exports = Router;
} else {
	this.Router = Router;
}

}).call(this);
},{}],10:[function(_dereq_,module,exports){
(function () {
	var key = 'assess';
	var State = {
		init: function () {
			this.data = JSON.parse(localStorage.getItem(key));
			if (this.data === null) {
				this.data = {
					questions: []
				};
				this.sync();
			}
		},

		sync: function () {
			localStorage.setItem(key, JSON.stringify(this.data));
		},

		getLapsedTime: function () {
			var lapsed = 0,
				q = this.data.questions,
				i = q.length;
			while (i--) {
				lapsed += q[i].lapsed || 0;
			}
			return lapsed;
		},

		getQuestions: function () {
			return this.data.questions;
		},

		setQuestion: function (question) {
			this.data.questions[question.ID - 1] = question;
			this.sync();
		},

		getQuestion: function (ID) {
			return this.data.questions[ID - 1] || {ID: ID, lapsed: 0, attempts: 0, completed: false, solution: null};
		}
	};

	if (typeof module !== 'undefined') {
		module.exports = State;
	} else {
		this.State = State;
	}
}).call(this);
},{}],11:[function(_dereq_,module,exports){
var util = _dereq_('util'),
	EventEmitter = _dereq_('events').EventEmitter;

function Timer() {
	this.interval = null;
	this.lapsed = 0;
}

util.inherits(Timer, EventEmitter);

Timer.prototype.start = function () {
	var self = this;
	this.interval = setInterval(function () {
		self.lapsed += 1000;
		self.emit('tick', self);
	}, 1000);

	return this;
};

Timer.prototype.stop = function () {
	if (this.interval) {
		clearInterval(this.interval);
		this.interval = null;
	}

	return this;
};

Timer.prototype.reset = function () {
	this.stop();
	this.lapsed = 0;

	return this;
};

module.exports = Timer;
},{"events":1,"util":5}]},{},[7])
(7)
});