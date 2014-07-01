describe('assess.js', function () {
	var router;

	beforeEach(function () {
		router = new Router();
		window.location.hash = '';
	});

	describe('router', function () {
		it('should get current hash', function () {
			window.location.hash = '#/contact';

			expect(router.hash()).toEqual('/contact');
		});

		it('should redirect', function () {
			router.redirect('/redirect');

			expect(window.location.hash).toEqual('#/redirect');
		});

		it('should normalize hash if / is missing', function () {
			router.redirect('normalize');

			expect(window.location.hash).toEqual('#/normalize');
		});

		it('should normalize hash if # is included', function () {
			router.redirect('#/normalize');

			expect(window.location.hash).toEqual('#/normalize');
		});

		it('should match exact route', function () {
			var spy = jasmine.createSpy();
			router
				.when('/exact', spy)
				.redirect('/exact')
				.process();

			expect(spy).toHaveBeenCalled();
		});

		it('should match wild card route', function () {
			var spy = jasmine.createSpy();
			router
				.when('/wild/card/:id', spy)
				.redirect('/wild/card/37')
				.process();

			expect(spy).toHaveBeenCalledWith('37');
		});

		it('should fallback to otherwise', function () {
			var spy = jasmine.createSpy();
			router
				.otherwise(spy)
				.redirect('/none')
				.process();

			expect(spy).toHaveBeenCalled();
		});

		it('should not invoke controller if hash is the same', function () {
			var counter = 0;
			router
				.when('/once', function () { counter++; })
				.redirect('/once')
				.process()
				.redirect('/once');

			expect(counter).toEqual(1);
		});

		it('should accept object with controller', function () {
			var spy = jasmine.createSpy();
			router
				.when('/object/controller', { controller: spy })
				.redirect('/object/controller')
				.process();

			expect(spy).toHaveBeenCalled();
		});

		it('should invoke beforeunload', function () {
			var called = false;

			runs(function () {
				router
					.redirect('/foo')
					.when('/foo', {
						controller: function () {},
						beforeunload: function () { called = true; }
					})
					.when('/bar', function () {})
					.process()
					.redirect('/bar');
			});

			waitsFor(function () {
				return called;
			});

			runs(function () {
				expect(called).toEqual(true);
			});
		});

		it('should allow unload to be stopped', function () {
			var called = false;

			runs(function () {
				router
					.redirect('/foo')
					.when('/foo', {
						controller: function () {},
						beforeunload: function (e) { e.stop(); called = true; }
					})
					.when('/bar', function () {})
					.process()
					.redirect('/bar');
			});

			waitsFor(function () {
				return called;
			});

			runs(function () {
				expect(router.hash()).toEqual('/foo');
			});
		});
	});
});