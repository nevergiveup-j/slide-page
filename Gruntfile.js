module.exports = function(grunt) {

	// var transport = require('grunt-cmd-transport');
	// var style = transport.style.init(grunt);
	// var text = transport.text.init(grunt);
	// var script = transport.script.init(grunt);
	
    grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
        // 压缩
        uglify: {
			options: {
				report: 'gzip',
                banner: '/** \n' +
						' * @Description: <%= pkg.name%> \n' +
                        ' * @Author: <%= pkg.author%> \n' +
                        ' * @Update: <%= grunt.template.today("yyyy-mm-dd HH:mm") %> \n' +
                        ' * @Github: <%= pkg.github %> \n' +
                        ' */ \n',
				beautify: {
	                //中文ascii化，非常有用！防止中文乱码的神配置
	                ascii_only: true
	            }
            },
            minify: {
				files: [
                    {
                        expand: true,
                        cwd: 'js/', // 需要压缩的文件夹路径
                        src: ['slide-page.js'], // 需要压缩的文件
                        dest: 'js/', // 压缩后存放的路径
                        ext: '.min.js' // 压缩后的扩展名
                    }
                ]
            }
        },
		/* css压缩 */
		cssmin: {
			options: {
                report: 'gzip',
                banner: '/** \n' +
                ' * @Description: <%= pkg.name%> \n' +
                ' * @Author: <%= pkg.author%> \n' +
                ' * @Update: <%= grunt.template.today("yyyy-mm-dd HH:mm") %> \n' +
                ' * @Github: <%= pkg.github %> \n' +
                ' */ \n'           
            },
            minify: {
				expand: true,
				cwd: 'css/',
				src: ['**/*.css', '!**/*.min.css'],
				dest: 'css/',
				ext: '.min.css'
			}
        },
		/* 图片压缩 */
		imagemin: {
			options: {
				optimizationLevel: 3
			},
			minify: {
				expand: true,
				cwd: 'images/',
	        	src: ['**/*.{png,jpg,gif}'],
	        	dest: 'images/'  
			}
		}
    });
    
    // load all grunt tasks
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
	

	grunt.registerTask('default', ['uglify', 'cssmin', 'imagemin']); // 创建任务，第一个参数为任务名，后续的数组中为分别要执行的任务。

}
