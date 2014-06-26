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

module.exports = Assert;