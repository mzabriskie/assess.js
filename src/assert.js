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
		input = Array.isArray(assertion.input) ? assertion.input : [assertion.input],
		output = null,
		result = false;

	try {
		this.interim.apply(null, input);
		output = this.callback.apply(null, input);
		if (!compare(output, assertion.output)) {
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

function compare(val1, val2) {
	if (Array.isArray(val1) && Array.isArray(val2)) {
		return compareArray(val1, val2);
	}
	else if (typeof val1 === 'object' && typeof val2 === 'object') {
		return compareObject(val1, val2);
	}
	else {
		return val1 === val2;
	}
}

function compareArray(arr1, arr2) {
	if (arr1.length !== arr2.length) {
		return false;
	}

	for (var i=0, l=arr1.length; i<l; i++) {
		if (!compare(arr1[i], arr2[i])) {
			return false;
		}
	}

	return true;
}

function compareObject(obj1, obj2) {
	if (obj1 === null && obj2 === null) {
		return true;
	}

	var keys1 = Object.keys(obj1),
		keys2 = Object.keys(obj2);

	if (!compareArray(keys1, keys2)) {
		return false;
	}

	for (var i=0, l=keys1.length; i<l; i++) {
		var key = keys1[i];
		if (!compare(obj1[key], obj2[key])) {
			return false;
		}
	}

	return true;
}

module.exports = Assert;