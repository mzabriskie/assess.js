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

module.exports = Timer;