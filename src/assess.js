module.exports = function () {
	'use strict';

	var Router = require('./router'),
		Timer = require('./timer'),
		Assert = require('./assert'),
		State = require('./state'),
		Console = require('./console');

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

		var k, v, unit;
		for (k in intervals) {
			if (!intervals.hasOwnProperty(k)) continue;

			v = intervals[k];
			unit = Math.floor(timeInMillis / v);
			timeInMillis %= v;

			if (sb.length > 0) sb += ':';
			if (unit < 10) unit = '0' + unit;
			sb += unit;
		}
		return sb;
	}

	// Handle meta + Enter
	function handleMetaEnter(f) {
		return function (e) {
			var isMac = navigator.platform.indexOf('Mac') > -1;
			if (e.keyCode === 13 && (isMac ? e.metaKey === true : e.ctrlKey === true)) {
				if (typeof e.stop === 'function') {
					e.stop();
				}
				if (typeof e.preventDefault === 'function') {
					e.preventDefault();
				}
				if (typeof f === 'function') {
					f();
				}
			}
		};
	}

	// Get next button action labels
	function getNextActionLabels(index, questions) {
		var button, console;

		if (index + 1 < questions.length) {
			button = 'Next';
			console = 'Click Next to continue to the next question.';
		} else {
			button = 'Finish';
			console = 'Click Finish to see your results.';
		}

		return {
			button: button,
			console: console
		};
	}

	// Handlebars helper to support math operations on @index
	// http://jsfiddle.net/mpetrovich/wMmHS/
	Handlebars.registerHelper('math', function(lvalue, operator, rvalue, options) {
		if (arguments.length < 4) {
			// Operator omitted, assuming "+"
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

	// Handlebars helper to support simple Markdown
	Handlebars.registerHelper('markdown', function (text) {
		return new Handlebars.SafeString(text.replace(/`(.*?)`/g, '<code>$1</code>'));
	});

	// Handlebars helper to pluralize
	Handlebars.registerHelper('pluralize', function (count, singular, plural) {
		return count > 1 ? plural : singular;
	});

	var timer = null,
		interval = null,
		standardConsole = window.console;

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
				.when('/results', function () {
					var qs = [];
					for (var i=0, l=questions.length; i<l; i++) {
						var q = questions[i],
							s = State.getQuestion(i+1);
						qs[i] = {
							name: q.name,
							description: q.description,
							attempts: s.attempts,
							lapsed: duration(s.lapsed)
						};
					}

					renderContent('results-template', {lapsed: duration(State.getLapsedTime()), questions: qs});
				})
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

						// Hijack console
						window.console = new Console(document.getElementById('console'));

						var button = document.getElementById('submit');

						// Initialize Question
						var q = State.getQuestion(ID);
						State.setQuestion(q);

						// Check Read Only state
						var readOnly = q.completed;
						if (q.solution) {
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

							document.getElementById('timer').innerHTML = duration(State.getLapsedTime());
						}

						function updateSolution() {
							q.solution = code.getValue();
							State.setQuestion(q);
						}

						function handleSubmitClick() {
							button.disabled = true;
							timer.stop();

							q.attempts += 1;
							State.setQuestion(q);

							// TODO: Gotta be something better than using eval
							if (typeof questions[index].callback === 'function') {
								/*jshint evil:true*/
								eval(code.getValue());
								callback = questions[index].callback;
							} else {
								/*jshint evil:true*/
								eval('callback = ' + code.getValue());
							}

							button.disabled = false;

							if (!assert.testAll()) {
								timer.start();
							} else {
								q.completed = true;
								updateSolution();

								var labels = getNextActionLabels(index, questions);
								assess.log('Nice work! ' + labels.console, 'info');

								// Update submit click handler to redirect to next screen
								button.innerHTML = labels.button;
								button.onclick = handleNextClick;
								window.onkeydown = handleMetaEnter(handleNextClick);
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

						// Sync solution on interval
						interval = setInterval(updateSolution, 250);

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
							window.onkeydown = handleMetaEnter(handleSubmitClick);
						} else {
							var labels = getNextActionLabels(index, questions);

							// Update lapsed time
							document.getElementById('timer').innerHTML = duration(State.getLapsedTime());

							// Handle Next click
							button.innerHTML = labels.button;
							button.onclick = handleNextClick;
							window.onkeydown = handleMetaEnter(handleNextClick);

							// Log instructions
							document.getElementById('console').innerHTML = '';
							assess.log(labels.console, 'info');
						}
					},
					beforeunload: function () {
						if (timer) {
							timer.stop();
						}
						if (interval) {
							clearTimeout(interval);
						}

						// Restore console
						window.console = standardConsole;

						document.getElementById('submit').onclick = null;
						window.onkeydown = null;
					}
				})
				.otherwise(function () { renderContent('404-template'); })
				.process();

			return this;
		},
		log: function (message, type) {
			console.__log(message, type);
		}
	};

	return assess;
};