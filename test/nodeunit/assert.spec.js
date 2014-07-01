var Assert = require('../../src/assert');

var assertions = [
	{input: '1 + 3',	output: 4},
	{input: '5 - 3',	output: 2},
	{input: '2 * 3',	output: 6},
	{input: '6 / 3',	output: 2},
	{input: '10 % 5',	output: 0},
	{input: ' 5    +1 ',output: 6},
	{input: '2+2',		output: 4},
	{input: '100 + 200',output: 300},
	{input: 'foo',		output: null}
];

function callback () {}
function interim () {}
function success () {}
function failure () {}

function doMath (expression) {
	var match = expression.match(/\s*([0-9]+)\s*(\*|\/|\+|\-|%)\s*([0-9]+)/);
	if (match) {
		var lvalue = parseInt(match[1], 10),
			operator = match[2],
			rvalue = parseInt(match[3], 10);

		return {
			'+': lvalue + rvalue,
			'-': lvalue - rvalue,
			'*': lvalue * rvalue,
			'/': lvalue / rvalue,
			'%': lvalue % rvalue
		}[operator];
	}
	return null;
}

module.exports = {
	setUp: function (fn) {
		this.assert = new Assert(assertions, callback, interim, success, failure);
		fn();
	},

	testAssertions: function (test) {
		test.deepEqual(this.assert.assertions, assertions);
		test.done();
	},

	testAssertionsMultiArgs: function (test) {
		this.assert.assertions = [
			{input: [1, 2], output: 3}
		];

		this.assert.callback = function (a, b) {
			return a + b;
		};

		test.equals(this.assert.testAll(), true);
		test.done();
	},

	testCallback: function (test) {
		test.equals(this.assert.callback, callback);

		var input = null;
		this.assert.interim = function () {
			input = arguments[0];
		};

		this.assert.test(0);

		test.equals(input, assertions[0].input);
		test.done();
	},

	testInterim: function (test) {
		test.equals(this.assert.interim, interim);

		var input = null;
		this.assert.interim = function () {
			input = arguments[0];
		};

		this.assert.test(0);

		test.equals(input, assertions[0].input);
		test.done();
	},

	testSuccess: function (test) {
		test.equals(this.assert.success, success);

		var index = -1,
			actual = null;
		this.assert.callback = function () {
			return assertions[0].output;
		};
		this.assert.success = function () {
			index = arguments[0];
			actual = arguments[1];
		};

		this.assert.test(0);

		test.equals(index, 0);
		test.equals(actual, assertions[0].output);
		test.done();
	},

	testFailure: function (test) {
		test.equals(this.assert.failure, failure);

		var index = -1,
			expected = null,
			actual = null;
		this.assert.callback = function () {
			return 'foo';
		};
		this.assert.failure = function () {
			index = arguments[0];
			expected = arguments[1];
			actual = arguments[2];
		};

		this.assert.test(0);

		test.equals(index, 0);
		test.equals(expected, assertions[0].output);
		test.equals(actual, 'foo');
		test.done();
	},

	testTestAll: function (test) {
		this.assert.callback = function () {
			return 'foo';
		};
		test.equals(this.assert.testAll(), false);

		this.assert.callback = doMath;
		test.equals(this.assert.testAll(), true);
		test.done();
	},

	testTest: function (test) {
		this.assert.callback = function () {
			return 'foo';
		};
		test.equals(this.assert.test(0), false);

		this.assert.callback = doMath;
		test.equals(this.assert.test(0), true);
		test.done();
	},

	testArrayValue: function (test) {
		function duplicate(arr) {
			var l = arr.length;
			for (var i=0; i<l; i++) {
				arr.push(arr[i]);
			}
			return arr;
		}

		this.assert.assertions = [
			{input: [[1, 2, 3]], output: [1, 2, 3, 1, 2, 3]},
			{input: [[4, 5, 6]], output: [4, 5, 6, 4, 5, 6]},
			{input: [[0, 1, 1, 2, 3, 5]], output: [0, 1, 1, 2, 3, 5, 0, 1, 1, 2, 3, 5]}
		];
		this.assert.callback = function (arr) {
			return duplicate(arr);
		};

		test.equals(this.assert.testAll(), true);
		test.done();
	},

	testObectValue: function (test) {
		this.assert.assertions = [
			{input: [{a: 1, b: 2}, {a: 9, c: 3, d: 4}], output: {a: 9, b: 2, c: 3, d: 4}}
		];
		this.assert.callback = function (a, b) {
			for (var k in b) {
				if (b.hasOwnProperty(k)) {
					a[k] = b[k];
				}
			}
			return a;
		};

		test.equals(this.assert.testAll(), true);
		test.done();
	}
};