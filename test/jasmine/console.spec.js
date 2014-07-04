describe('assess.js', function () {
	describe('console', function () {
		var element,
			console;

		beforeEach(function () {
			element = document.createElement('div');
			console = new Console(element);
		});

		it('should provide constructor', function () {
			expect(typeof Console).toEqual('function');
		});

		it('should know which element it outputs to', function () {
			expect(console.outlet).toEqual(element);
		});

		describe('assert', function () {
			it('should provide assert method', function () {
				expect(typeof console.assert).toEqual('function');
			});

			it('should not do anything if expression is true', function () {
				console.assert(true, 'foo');
				expect(console.outlet.children.length).toEqual(0);
			});

			it('should log an error if expression is false', function () {
				console.assert(false, 'foo');
				expect(console.outlet.children.length).toEqual(1);
				expect(console.outlet.children[0].innerHTML).toEqual('foo');
				expect(console.outlet.children[0].className).toEqual('error');
			});
		});

		describe('clear', function () {
			it('should provide clear method', function () {
				expect(typeof console.clear).toEqual('function');
			});

			it('should clear output', function () {
				console.log('foo');
				console.clear();
				expect(console.outlet.children.length).toEqual(0);
			});
		});

		describe('count', function () {
			it('should provide count method', function () {
				expect(typeof console.count).toEqual('function');
			});

			it('should count how many times a method is called', function () {
				function foo() { console.count('foo'); }
				function bar() { console.count('bar'); }

				foo(); foo(); foo();
				bar(); bar();

				expect(console.outlet.children.length).toEqual(5);
				expect(console.outlet.children[0].innerHTML).toEqual('foo: 1');
				expect(console.outlet.children[1].innerHTML).toEqual('foo: 2');
				expect(console.outlet.children[2].innerHTML).toEqual('foo: 3');
				expect(console.outlet.children[3].innerHTML).toEqual('bar: 1');
				expect(console.outlet.children[4].innerHTML).toEqual('bar: 2');
			});
		});

		describe('debug', function () {
			it('should provide debug method', function () {
				expect(typeof console.debug).toEqual('function');
				expect(console.debug).toEqual(console.log);
			});
		});

		describe('dir', function () {
			it('should provide dir method', function () {
				expect(typeof console.dir).toEqual('function');
				expect(console.dir).toEqual(console.__notimpl);
			});
		});

		describe('dirxml', function () {
			it('should provide dirxml method', function () {
				expect(typeof console.dirxml).toEqual('function');
				expect(console.dirxml).toEqual(console.__notimpl);
			});
		});

		describe('error', function () {
			it('should provide error method', function () {
				expect(typeof console.error).toEqual('function');
			});

			it('should log all arguments', function () {
				console.error('foo', 'bar', 'baz');
				expect(console.outlet.children.length).toEqual(1);
				expect(console.outlet.children[0].innerHTML).toEqual('foo bar baz');
				expect(console.outlet.children[0].className).toEqual('error');
			});
		});

		describe('group', function () {
			it('should provide group method', function () {
				expect(typeof console.group).toEqual('function');
				expect(console.group).toEqual(console.__notimpl);
			});
		});

		describe('groupCollapsed', function () {
			it('should provide groupCollapsed method', function () {
				expect(typeof console.groupCollapsed).toEqual('function');
				expect(console.groupCollapsed).toEqual(console.__notimpl);
			});
		});

		describe('groupEnd', function () {
			it('should provide groupEnd method', function () {
				expect(typeof console.groupEnd).toEqual('function');
				expect(console.groupEnd).toEqual(console.__notimpl);
			});
		});

		describe('info', function () {
			it('should provide info method', function () {
				expect(typeof console.info).toEqual('function');
			});

			it('should log all arguments', function () {
				console.info('foo', 'bar', 'baz');
				expect(console.outlet.children.length).toEqual(1);
				expect(console.outlet.children[0].innerHTML).toEqual('foo bar baz');
				expect(console.outlet.children[0].className).toEqual('info');
			});
		});

		describe('log', function () {
			it('should provide log method', function () {
				expect(typeof console.log).toEqual('function');
			});

			it('should log all arguments', function () {
				console.log('foo', 'bar', 'baz');
				expect(console.outlet.children.length).toEqual(1);
				expect(console.outlet.children[0].innerHTML).toEqual('foo bar baz');
			});
		});

		describe('profile', function () {
			it('should provide profile method', function () {
				expect(typeof console.profile).toEqual('function');
				expect(console.profile).toEqual(console.__notimpl);
			});
		});

		describe('profileEnd', function () {
			it('should provide profileEnd method', function () {
				expect(typeof console.profileEnd).toEqual('function');
				expect(console.profileEnd).toEqual(console.__notimpl);
			});
		});

		describe('time', function () {
			it('should provide time method', function () {
				expect(typeof console.time).toEqual('function');
				expect(console.time).toEqual(console.__notimpl);
			});
		});

		describe('timeEnd', function () {
			it('should provide timeEnd method', function () {
				expect(typeof console.timeEnd).toEqual('function');
				expect(console.timeEnd).toEqual(console.__notimpl);
			});
		});

		describe('timeline', function () {
			it('should provide timeline method', function () {
				expect(typeof console.timeline).toEqual('function');
				expect(console.timeline).toEqual(console.__notimpl);
			});
		});

		describe('timelineEnd', function () {
			it('should provide timelineEnd method', function () {
				expect(typeof console.timelineEnd).toEqual('function');
				expect(console.timelineEnd).toEqual(console.__notimpl);
			});
		});

		describe('timeStamp', function () {
			it('should provide timeStamp method', function () {
				expect(typeof console.timeStamp).toEqual('function');
				expect(console.timeStamp).toEqual(console.__notimpl);
			});
		});

		describe('trace', function () {
			it('should provide trace method', function () {
				expect(typeof console.trace).toEqual('function');
				expect(console.trace).toEqual(console.__notimpl);
			});
		});

		describe('warn', function () {
			it('should provide warn method', function () {
				expect(typeof console.warn).toEqual('function');
			});

			it('should log all arguments', function () {
				console.warn('foo', 'bar', 'baz');
				expect(console.outlet.children.length).toEqual(1);
				expect(console.outlet.children[0].innerHTML).toEqual('foo bar baz');
				expect(console.outlet.children[0].className).toEqual('warn');
			});
		});
	});
});