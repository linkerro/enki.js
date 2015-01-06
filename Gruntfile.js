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
                src: ['src/*.js', 'test/*.js']
            }
        },
        jsdoc: {
            options: {
                destination: 'doc'
            },
            target: {
                src: 'src/*.js'
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-jsdoc');

    // Set up the tasks.
    grunt.registerTask('default', ['eslint', 'uglify']);
};