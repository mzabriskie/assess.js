describe('assess.js', function () {
	var data = {
		lapsed: 37,
		questions: [
			{
				ID: 1,
				lapsed: 10,
				attempts: 1,
				solution: 'function reverse(str) { return str.split(\'\').reverse().join(\'\'); }'
			},
			{
				ID: 2,
				lapsed: 27,
				attempts: 2,
				solution: 'function multiply(val) { return parseInt(val, 10) * 2; }'
			}
		]
	};

	function getData() {
		return JSON.parse(localStorage.getItem('assess'));
	}

	beforeEach(function () {
		localStorage.setItem('assess', JSON.stringify(data));
		State.init();
	});

	describe('state', function () {
		it('should initialize', function () {
			expect(State.data).toEqual(getData());
		});

		it('should create localStorage if empty', function () {
			localStorage.clear();
			State.init();

			expect(State.data).toEqual({lapsed: 0, questions: []});
		});

		it('should set lapsed time', function () {
			State.setLapsedTime(100);

			expect(State.data.lapsed).toEqual(100);
			expect(getData().lapsed).toEqual(100);
		});

		it('should get lapsed time', function () {
			expect(State.getLapsedTime()).toEqual(37);
		});

		it('should get questions', function () {
			expect(State.getQuestions().length).toEqual(2);
		});

		it('should set single question', function () {
			var question = data.questions[0];
			question.lapsed = 15;
			State.setQuestion(question);

			expect(State.data.questions[0].lapsed).toEqual(15);
			expect(getData().questions[0].lapsed).toEqual(15);
		});

		it('should get single question', function () {
			expect(State.getQuestion(1)).toEqual(data.questions[0]);
		});
	});
});