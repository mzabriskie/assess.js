/*global module:false*/
module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.initConfig({
		jshint: {
			all: ['Gruntfile.js', 'assess.js', 'test/spec.js']
		},
		watch: {
			src: {
				files: ['assess.js', 'test/spec.js'],
				tasks: ['jshint']
			}
		}
	});

	grunt.registerTask('test', ['jshint']);
};