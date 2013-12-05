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

		// Facade for removing DOM events
		function removeEvent(el, event, handler) {
			if (el.detachEvent) {
				el.detachEvent('on' + event, handler);
			} else if (el.removeEventListener) {
				el.removeEventListener(event, handler, true);
			} else {
				el['on' + event] = null;
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
		// TODO: Support events for load, beforeunload, etc.
		function Router() {
			this.routes = {};
			this.fallback = null;

			addEvent(window, 'hashchange', function () {
				this.goto(this.hash());
			}.bind(this));
		}

		Router.prototype.hash = function () {
			return window.location.hash.replace(/^#\/?/, '');
		};

		Router.prototype.when = function (route, callback) {
			route = trim(route);
			if (route.indexOf('/') !== 0) {
				route = '/' + route;
			}

			var pattern = route.replace(/\/(:[^\/]*)/g, '/([^\/]*)');
			this.routes[route] = {
				pattern: (route === pattern) ? null : new RegExp('^'+pattern+'$'),
				callback: callback
			};

			return this;
		};

		Router.prototype.otherwise = function (callback) {
			this.fallback = callback;
			return this;
		};

		Router.prototype.goto = function (hash) {
			hash = trim(hash);
			if (hash.length === 0) {
				hash = this.hash();
			}
			if (hash.indexOf('/') !== 0) {
				hash = '/' + hash;
			}

			var route = this.routes[''],
				args = null;
			if (hash.length > 0) {
				if (typeof this.routes[hash] !== 'undefined') {
					route = this.routes[hash];
				}
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

			if (typeof route !== 'undefined' && typeof route.callback === 'function') {
				route.callback.apply(null, args);
			} else if (typeof this.fallback === 'function') {
				this.fallback.call(null, hash);
			}
		};

		return Router;
	})();

	window.assess = function () {
		return {
			init: function () {
				CodeMirror.fromTextArea(document.getElementById('code'), {
					lineNumbers: true,
					matchBrackets: true
				});

				new Router()
					.when('/', function () { console.log('Home'); })
					.when('/content', function () { console.log('Content'); })
					.when('/q/:ID', function (ID) { console.log('Question'); })
					.otherwise(function (hash) { console.log('Cannot find ' + hash); })
					.goto();
			}
		};
	};

})(window);