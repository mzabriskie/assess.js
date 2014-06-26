module.exports = function () {
	'use strict';

	var Router = require('./router'),
		Timer = require('./timer'),
		Assert = require('./assert');

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

	var lapsed = 0,
		timer = null;

	var assess = {
		init: function (questions) {
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
						renderContent('question-template', questions[index]);

						// Initialize CodeMirror, Timer and Assert
						var callback = null,
							code, assert;

						code = CodeMirror.fromTextArea(document.getElementById('code'), {
							lineNumbers: true,
							matchBrackets: true
						});

						timer = new Timer('timer').start();
						assert = new Assert(questions[index].test,
												function () { return callback.apply(null, arguments); },
												function () { assess.log('Testing input "' + arguments[0] + '"...'); },
												function () { assess.log(arguments[1] + ' is correct.', 'pass'); },
												function () { assess.log('Expected ' + arguments[1] + ' but got ' + arguments[2], 'fail'); });

						// Handle Done! click
						document.getElementById('submit').onclick = function () {
							timer.stop();

							// TODO: Gotta be something better than using eval
							/*jshint evil:true*/
							eval('callback = ' + code.getValue());

							if (!assert.testAll()) {
								timer.start();
							} else {
								assess.log('Nice work! Click Done! to continue to the next question.', 'info');

								// Update submit click handler to redirect to next screen
								document.getElementById('submit').onclick = function () {
									var hash = '';
									if (index + 1 < questions.length) {
										hash = '/q/' + (index + 2);
									} else {
										hash = '/results';
									}
									router.redirect(hash);
								};
							}
						};
					},
					beforeunload: function (e) {
						/*if (!confirm('Are you sure?')) { e.stop(); }*/
						lapsed += timer.lapsed;
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