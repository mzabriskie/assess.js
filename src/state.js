(function () {
	var key = 'assess';
	var State = {
		init: function () {
			this.data = JSON.parse(localStorage.getItem(key));
			if (this.data === null) {
				this.data = {
					questions: []
				};
				this.sync();
			}
		},

		sync: function () {
			localStorage.setItem(key, JSON.stringify(this.data));
		},

		getLapsedTime: function () {
			var lapsed = 0,
				q = this.data.questions,
				i = q.length;
			while (i--) {
				lapsed += q[i].lapsed || 0;
			}
			return lapsed;
		},

		getQuestions: function () {
			return this.data.questions;
		},

		setQuestion: function (question) {
			this.data.questions[question.ID - 1] = question;
			this.sync();
		},

		getQuestion: function (ID) {
			return this.data.questions[ID - 1] || {ID: ID, lapsed: 0, attempts: 0, completed: false, solution: null};
		}
	};

	if (typeof module !== 'undefined') {
		module.exports = State;
	} else {
		this.State = State;
	}
}).call(this);