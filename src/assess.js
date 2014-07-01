module.exports = function () {
	'use strict';

	var Router = require('./router'),
		Timer = require('./timer'),
		Assert = require('./assert'),
		State = require('./state');

	// Cache compiled templates and render to container
	var templates = {},
		container = document.getElementById('container');
	function renderContent(templateID, context) {
		if (typeof templates[templateID] === 'undefined') {
			var source = document.getElementById(templateID).innerHTML;
			templates[templateID] = Handlebars.compile(source);
		}

		container.innerHTML = templates[templateID](context);
	}

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

	// Handlebars helper to support math operations on @index
	// http://jsfiddle.net/mpetrovich/wMmHS/
	Handlebars.registerHelper('math', function(lvalue, operator, rvalue, options) {
		if (arguments.length < 4) {
			// Operator omitted, assuming "+"
			options = rvalue;
			rvalue = operator;
			operator = '+';
		}

		lvalue = parseFloat(lvalue);
		rvalue = parseFloat(rvalue);

		return {
			'+': lvalue + rvalue,
			'-': lvalue - rvalue,
			'*': lvalue * rvalue,
			'/': lvalue / rvalue,
			'%': lvalue % rvalue
		}[operator];
	});

	// Stupid simple Markdown parser to allow code blocks
	function markdown(md) {
		return md.replace(/`(.*?)`/g, '<code>$1</code>');
	}

	var timer = null;

	var assess = {
		init: function (questions) {
			State.init();

			var router = new Router()
				.when('/', function () {
					renderContent('home-template');

					document.getElementById('start').onclick = function () {
						this.redirect('/q/1');
					}.bind(this);
				})
				.when('/content', function () { renderContent('content-template', {questions: questions}); })
				.when('/results', function () { renderContent('results-template', {questions: questions}); })
				.when('/q/:ID', {
					controller: function (ID) {
						var index = parseInt(ID, 10) - 1,
							hash = null;

						// Validate requested hash
						if (index < 0) {
							hash = '/q/1';
						} else if (index >= questions.length) {
							hash = '/q/' + questions.length;
						}

						if (hash !== null) {
							this.redirect(hash);
							return;
						}

						// Render tempalte
						renderContent('question-template', {
							question: questions[index],
							progress: {
								current: (index+1),
								total: questions.length
							}
						});

						var button = document.getElementById('submit'),
							description = document.getElementById('description');
						description.innerHTML = markdown(description.innerHTML);

						// Initialize Question
						var q = State.getQuestion(ID) || {ID: ID, lapsed: 0, attempts: 0, solution: null};
						State.setQuestion(q);

						// Check Read Only state
						var readOnly = q.solution !== null;
						if (readOnly) {
							document.getElementById('code').value = q.solution;
						}

						// Initialize CodeMirror, Timer, and Assert
						var callback = null,
							code, assert;

						code = CodeMirror.fromTextArea(document.getElementById('code'), {
							lineNumbers: true,
							matchBrackets: true,
							readOnly: readOnly
						});

						// Helper functions
						function updateLapsedTime() {
							q.lapsed = timer.lapsed;
							State.setQuestion(q);

							document.getElementById('timer').innerHTML = duration(State.getLapsedTime() + timer.lapsed);
						}

						function handleSubmitClick() {
							button.disabled = true;
							timer.stop();

							q.attempts += 1;
							State.setQuestion(q);

							// TODO: Gotta be something better than using eval
							/*jshint evil:true*/
							eval('callback = ' + code.getValue());

							button.disabled = false;

							if (!assert.testAll()) {
								timer.start();
							} else {
								q.solution = code.getValue();
								State.setQuestion(q);

								assess.log('Nice work! Click Next to continue to the next question.', 'info');

								// Update submit click handler to redirect to next screen
								button.innerHTML = 'Next';
								button.onclick = handleNextClick;
							}
						}

						function handleNextClick() {
							var hash = '';
							if (index + 1 < questions.length) {
								hash = '/q/' + (index + 2);
							} else {
								hash = '/results';
							}
							router.redirect(hash);
						}

						// Only hook up assert and timer if solution hasn't already been provided
						if (!readOnly) {
							timer = new Timer().start();
							timer.lapsed = q.lapsed;

							assert = new Assert(questions[index].test,
													function () { return callback.apply(null, arguments); },
													function () { assess.log('Testing input "' + arguments[0] + '"...'); },
													function () { assess.log(arguments[1] + ' is correct.', 'pass'); },
													function () { assess.log('Expected ' + arguments[1] + ' but got ' + arguments[2], 'fail'); });

							// Update lapsed time
							timer.on('tick', updateLapsedTime);
							updateLapsedTime();

							// Handle Done! click
							button.onclick = handleSubmitClick;
						} else {
							// Update lapsed time
							document.getElementById('timer').innerHTML = duration(State.getLapsedTime());

							// Handle Next click
							button.innerHTML = 'Next';
							button.onclick = handleNextClick;

							// Log instructions
							document.getElementById('console').innerHTML = '';
							assess.log('Click Next to continue to the next question.', 'info');
						}
					},
					beforeunload: function (e) {
						/*if (!confirm('Are you sure?')) { e.stop(); }*/
						if (timer) {
							timer.stop();
							State.setLapsedTime(State.getLapsedTime() + timer.lapsed);
						}
						document.getElementById('submit').onclick = null;
					}
				})
				.otherwise(function () { renderContent('404-template'); })
				.process();

			return this;
		},
		log: function (message, type) {
			var out = document.createElement('div'),
				console = document.getElementById('console');
			console.appendChild(out);
			out.innerHTML = message;
			if (typeof type !== 'undefined') {
				out.className = type;
			}
			console.scrollTop = console.scrollHeight;

			return this;
		}
	};

	return assess;
};