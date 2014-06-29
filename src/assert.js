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
	var assertion = this.assertions[index],
		output = null,
		result = false;
	try {
		this.interim.call(null, assertion.input);
		output = this.callback.call(null, assertion.input);
		if (output !== assertion.output) {
			throw new Error();
		} else {
			this.success.call(null, index, output);
			result = true;
		}
	} catch (e) {
		this.failure.call(null, index, assertion.output, output);
	}
	return result;
};

module.exports = Assert;