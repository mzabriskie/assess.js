(function () {
	var key = 'assess';
	var State = {
		init: function () {
			this.data = JSON.parse(localStorage.getItem(key));
		},

		sync: function () {
			localStorage.setItem(key, JSON.stringify(this.data));
		},

		setLapsedTime: function (lapsed) {
			this.data.lapsed = lapsed;
			this.sync();
		},

		getLapsedTime: function () {
			return this.data.lapsed;
		},

		getQuestions: function () {
			return this.data.questions;
		},

		setQuestion: function (question) {
			this.data.questions[question.ID - 1] = question;
			this.sync();
		},

		getQuestion: function (ID) {
			return this.data.questions[ID - 1];
		}
	};

	if (typeof module !== 'undefined') {
		module.exports = State;
	} else {
		this.State = State;
	}
}).call(this);