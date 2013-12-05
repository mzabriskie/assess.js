(function (window) {
	'use strict';

	window.assess = function () {
		return {
			init: function () {
				CodeMirror.fromTextArea(document.getElementById('code'), {
					lineNumbers: true,
					matchBrackets: true
				});
			}
		};
	};

})(window);