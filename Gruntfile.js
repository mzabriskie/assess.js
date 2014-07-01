/*global module:false*/
module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		jshint: {
			all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
		},
		nodeunit: {
			all: ['test/nodeunit/**/*.js']
		},
		karma: {
			options: {
				configFile: 'karma.conf.js'
			},
			single: {
				singleRun: true
			},
			continuous: {
				singleRun: false
			}
		},
		watch: {
			all: {
				files: ['src/**/*.js', 'test/**/*.js'],
				tasks: ['default']
			},
			test: {
				files: ['src/**/*.js', 'test/**/*.js'],
				tasks: ['test']
			},
			nodeunit: {
				files: ['src/**/*.js', 'test/nodeunit/**/*.js'],
				tasks: ['nodeunit']
			},
			karma: {
				files: ['src/**/*.js', 'test/jasmine/**/*.js'],
				tasks: ['karma:single']
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

	grunt.registerTask('test', ['jshint', 'nodeunit', 'karma:single']);
	grunt.registerTask('publish', ['browserify:dist', 'uglify:dist']);
	grunt.registerTask('default', ['test', 'publish']);
};