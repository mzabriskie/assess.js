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
	if (this.current != null && this.current.hash === hash) {
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
	if (this.current != null && typeof this.current.route.beforeunload === 'function') {
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