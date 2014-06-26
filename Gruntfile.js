/*global module:false*/
module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		jshint: {
			all: ['Gruntfile.js', 'assess.js', 'test/spec.js']
		},
		watch: {
			src: {
				files: ['assess.js', 'test/spec.js'],
				tasks: ['jshint']
			}
		},
		uglify: {
			dist: {
				files: {
					'dist/assess.min.js': ['dist/assess.js']
				}
			}
		},
		browserify: {
			dist: {
				src: ['src/assess.js'],
				dest: 'dist/assess.js',
				options: {
					bundleOptions: {
						standalone: 'assess'
					}
				}
			}
		}
	});

	grunt.registerTask('test', ['jshint']);
	grunt.registerTask('publish', ['browserify:dist', 'uglify:dist']);
	grunt.registerTask('default', ['test', 'publish']);
};