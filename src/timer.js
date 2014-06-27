var util = require('util'),
	EventEmitter = require('events').EventEmitter;

function Timer() {
	this.interval = null;
	this.lapsed = 0;
}

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

util.inherits(Timer, EventEmitter);

module.exports = Timer;