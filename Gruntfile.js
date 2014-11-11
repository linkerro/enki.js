module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                files: grunt.file.expandMapping(['src/*.js'], 'build/', {
                    rename: function (destBase, destPath) {
                        return destBase + destPath.replace('.js', '.min.js').replace('src/', '');
                    }
                })

            }
        },
        eslint: {
            target: {
                src: 'src/*.js'
            }
        },
        jasmine: {
            options: {
                specs: 'test/*.js',
                vendor: 'test/lib/jasmine-2.0.0/jasmine-dom-fixtures.js',
                keepRunner: false
            },
            target: {
                src: 'src/*.js'
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    // Set up the tasks.
    grunt.registerTask('default', ['eslint', 'jasmine', 'uglify']);
    grunt.registerTask('test', ['jasmine', 'eslint']);
};