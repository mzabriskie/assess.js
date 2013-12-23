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

		// Normalize the hash
		function normalize(hash) {
			hash = trim(hash);
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
			return window.location.hash.replace(/^#\/?/, '');
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
			if (this.current !== null && this.current.hash === hash) {
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
			if (this.current !== null && typeof this.current.route.beforeunload === 'function') {
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

	var Assert = (function () {
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
			var a = this.assertions[index],
				r = null,
				v = false;
			try {
				this.interim.call(null, a.i);
				r = this.callback.call(null, a.i);
				if (r !== a.o) {
					throw new Error();
				} else {
					this.success.call(null, index, r);
					v = true;
				}
			} catch (e) {
				this.failure.call(null, index, a.o, r);
			}
			return v;
		};

		return Assert;
	})();

	window.assess = function () {
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

		// Handlebars helper to support math operations on @index
		// http://jsfiddle.net/mpetrovich/wMmHS/
		Handlebars.registerHelper('math', function(lvalue, operator, rvalue, options) {
			if (arguments.length < 4) {
				// Operator omitted, assuming "+"
				options = rvalue;
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

		var lapsed = 0,
			timer = null;

		var assess = {
			init: function (questions) {
				var router = new Router()
					.when('/', function () { renderContent('home-template'); })
					.when('/content', function () { renderContent('content-template', {questions: questions}); })
					.when('/results', function () { renderContent('results-template'); })
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
							renderContent('question-template', questions[index]);

							// Initialize CodeMirror, Timer and Assert
							var callback = null,
								code, assert;

							code = CodeMirror.fromTextArea(document.getElementById('code'), {
								lineNumbers: true,
								matchBrackets: true
							});

							timer = new Timer('timer').start();
							assert = new Assert(questions[index].test,
													function () { return callback.apply(null, arguments); },
													function () { assess.log('Testing input "' + arguments[0] + '"...'); },
													function () { assess.log(arguments[1] + ' is correct.', 'pass'); },
													function () { assess.log('Expected ' + arguments[1] + ' but got ' + arguments[2], 'fail'); });

							// Handle Done! click
							document.getElementById('submit').onclick = function () {
								timer.stop();

								// TODO: Gotta be something better than using eval
								/*jshint evil:true*/
								eval('callback = ' + code.getValue());

								if (!assert.testAll()) {
									timer.start();
								} else {
									assess.log('Nice work! Click Done! to continue to the next question.', 'info');

									// Update submit click handler to redirect to next screen
									document.getElementById('submit').onclick = function () {
										var hash = '';
										if (index + 1 < questions.length) {
											hash = '/q/' + (index + 2);
										} else {
											hash = '/results';
										}
										router.redirect(hash);
									};
								}
							};
						},
						beforeunload: function (e) {
							/*if (!confirm('Are you sure?')) { e.stop(); }*/
							lapsed += timer.lapsed;
							document.getElementById('submit').onclick = null;
						}
					})
					.otherwise(function () { renderContent('404-template'); })
					.process();

				return this;
			},
			log: function (message, type) {
				var out = document.createElement('div'),
					console = document.getElementById('console');
				console.appendChild(out);
				out.innerHTML = message;
				if (typeof type !== 'undefined') {
					out.className = type;
				}
				console.scrollTop = console.scrollHeight;

				return this;
			}
		};

		return assess;
	};

})(window);