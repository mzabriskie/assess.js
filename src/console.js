(function () {
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

	Console.prototype.log = function () {
		var message = [];
		for (var i=0, l=arguments.length; i<l; i++) {
			message.push(arguments[i]);
		}
		this.__log(message.join(' '));
	};

	if (typeof module !== 'undefined') {
		module.exports = Console;
	} else {
		this.Console = Console;
	}
}).call(this);