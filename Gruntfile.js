module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                files: grunt.file.expandMapping(['src/*.js'], 'build/', {
                    rename: function(destBase, destPath) {
                        return destBase+destPath.replace('.js', '.min.js').replace('src/','');
                    }
                })

            }
        },
        eslint:{
            target:{
                src:'src/*.js'
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-eslint');
    // Default task(s).
    grunt.registerTask('default', ['eslint','uglify']);

};