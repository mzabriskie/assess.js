(function (window) {
	'use strict';

	var Router = (function () {
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

		// Simple router for handling hash changes
		function Router() {
			this.routes = {};
			this.fallback = null;

			addEvent(window, 'hashchange', function () {
				this.process(this.hash());
			}.bind(this));
		}

		Router.prototype.hash = function () {
			return window.location.hash.replace(/^#\/?/, '');
		};

		Router.prototype.when = function (hash, callback) {
			// Normalize hash
			hash = trim(hash);
			if (hash.indexOf('/') !== 0) {
				hash = '/' + hash;
			}

			var pattern = hash.replace(/\/(:[^\/]*)/g, '/([^\/]*)'),
				route = typeof callback === 'object' ? callback : { callback: callback };

			route.pattern = (hash === pattern) ? null : new RegExp('^' + pattern + '$');
			this.routes[hash] = route;

			return this;
		};

		Router.prototype.otherwise = function (callback) {
			this.current = null;
			this.fallback = callback;
			return this;
		};

		Router.prototype.process = function (hash) {
			// Normalize hash
			hash = trim(hash);
			if (hash.length === 0) {
				hash = this.hash();
			}
			if (hash.indexOf('/') !== 0) {
				hash = '/' + hash;
			}

			// Don't handle hash if it hasn't changed
			if (this.current !== null && this.current.hash === hash) {
				return;
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
			if (this.current !== null && typeof this.current.route.beforeunload === 'function') {
				// Provide stoppable event
				var event = {
					stopped: false,
					stop: function () {
						this.stopped = true;
					}
				};

				this.current.route.beforeunload.call(null, event);

				// If event was stopped, reset hash
				if (event.stopped) {
					window.history.back();
					return;
				}
			}

			// Reset current route
			this.current = null;

			// Invoke matching route, if any
			if (typeof route !== 'undefined' && typeof route.callback === 'function') {
				route.callback.apply(null, args);

				// Update current route
				this.current = {
					hash: hash,
					route: route
				};
			}
			// Invoke fallback, if any
			else if (typeof this.fallback === 'function') {
				this.fallback.call(null, hash);
			}
		};

		return Router;
	})();

	var Timer = (function () {
		// Format duration of time in milliseconds
		function duration(timeInMillis) {
			var intervals = {
					'm': 60000,
					's': 1000
				},
				sb = '';

			for (var k in intervals) {
				if (!intervals.hasOwnProperty(k)) continue;

				var v = intervals[k],
					unit = Math.floor(timeInMillis / v);
				timeInMillis %= v;

				if (sb.length > 0) sb += ':';
				if (unit < 10) unit = '0' + unit;
				sb += unit;
			}
			return sb;
		}

		function Timer(element) {
			this.element = typeof element === 'string' ? document.getElementById(element) : element;
			this.interval = null;
			this.lapsed = 0;
		}

		Timer.prototype.start = function () {
			var self = this;
			this.interval = setInterval(function () {
				self.lapsed += 1000;
				self.element.innerHTML = duration(self.lapsed);
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

		return Timer;
	})();

	window.assess = function () {
		var templates = {},
			container = document.getElementById('container');
		function renderContent(templateID, context) {
			if (typeof templates[templateID] === 'undefined') {
				var source = document.getElementById(templateID).innerHTML;
				templates[templateID] = Handlebars.compile(source);
			}

			container.innerHTML = templates[templateID](context);
		}

		return {
			init: function () {
				new Router()
					.when('/', function () { renderContent('home-template'); })
					.when('/content', function () { renderContent('content-template'); })
					.when('/q/:ID', {
						callback: function (ID) {
							renderContent('question-template');

							CodeMirror.fromTextArea(document.getElementById('code'), {
								lineNumbers: true,
								matchBrackets: true
							});
						},
						beforeunload: function (e) { if (!confirm('Are you sure?')) { e.stop(); } }
					})
					.otherwise(function () { renderContent('404-template'); })
					.process();

				this.timer = new Timer('timer').start();

				return this;
			},
			log: function (message, type) {
				var out = document.createElement('div');
				document.getElementById('console').appendChild(out);
				out.innerHTML = message;
				if (typeof type !== 'undefined') {
					out.className = type;
				}

				return this;
			}
		};
	};

})(window);