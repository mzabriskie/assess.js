var Timer = require('../../src/timer');

module.exports = {
	testStart: function (test) {
		var timer = new Timer();

		test.equals(typeof timer.start, 'function');
		test.equals(timer.lapsed, 0);

		timer.start();
		setTimeout(function () {
			test.equals(timer.lapsed, 1000);
			test.done();
		}, 1000);
	},

	testStop: function (test) {
		var timer = new Timer();

		test.equals(typeof timer.stop, 'function');

		timer.start();
		setTimeout(function () {
			timer.stop();
			setTimeout(function () {
				test.equals(timer.lapsed, 1000);
				test.done();
			}, 1000);
		}, 1000);
	},

	testReset: function (test) {
		var timer = new Timer();

		test.equals(typeof timer.reset, 'function');

		timer.start();
		setTimeout(function () {
			timer.reset();
			test.equals(timer.lapsed, 0);
			test.done();
		}, 1000);
	}
};