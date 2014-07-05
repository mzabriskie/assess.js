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
		var el = document.createElement('div');
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