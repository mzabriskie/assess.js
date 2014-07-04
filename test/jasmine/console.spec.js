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

		it('should provide log method', function () {
			expect(typeof console.log).toEqual('function');
		});

		it('should log all arguments', function () {
			console.log('foo', 'bar', 'baz');
			expect(console.outlet.children.length).toEqual(1);
			expect(console.outlet.children[0].innerHTML).toEqual('foo bar baz');
		});
	});
});