module.exports = function (grunt) {
	//описываем конфигурацию
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
		//проверка корректности кода
		jshint: {
				options:{
					"curly" : true,     // true: Require {} for every new block or scope
					"immed" : true,    // true: Require immediate invocations to be wrapped in parens e.g. `(function () { } ());`
					"latedef" : true,    // true: Require variables/functions to be defined before being used
					"noarg" : true,     // true: Prohibit use of `arguments.caller` and `arguments.callee`
					"browser" : true,     // Web Browser (window, document, etc)
					"globals": {
						jQuery: true,
						$: true,
						console: true
					}
				},
				'<%= pkg.name %>': {
					src: ['js/**/*.js']
				}
		},

		//склейка файлов в один
		concat: {
			
			dist: {
				src: [	"js/jquery-2.2.1.min.js",
						"js/bootstrap.min.js",
						"js/jquery-ui.js",
						"js/datepicker-ru.js",
						"js/md5.js",
						"js/proto.js",
						"js/init.js",
						"js/authorization.js",
						"js/events.js",
						"js/categories.js",
						"js/export.js"
					],
				dest: 'dest/build.js'
			}
		},
		
		//минификация файла js 
		uglify: {
			options: {
				stripBanners: true,
				banner: '/* <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>*/\n',
			},
			build: {
				src: 'dest/build.js',
				dest: 'dest/build.min.js'
			}
		},
		
		cssmin: {
			with_banner: {
				options: {
					banner: '/*Minified CSS*/'
				},
				

				
				files: {
					'dest/style.min.css' : ["css/bootstrap.min.css",
											"css/jquery-ui.css",
											"css/style.css"]
				}
			}
		},
		
		watch: {
			scripts: { 
				files: ['js/*.js'],
				//какие задачи должны запуститься, если изменяются файлы, указанные в files; указываем те же задачи, что и в default
				tasks: ['concat', 'uglify', 'removelogging']
			},
			css: {
				files: ['css/*.css'],
				tasks: ['cssmin']
			}
		},
		
		removelogging: {
			dist: {
				src: 'dest/build.min.js', //передали на вход
				dest: 'dest/build.clean.js' //результат
			}
		}
	});
	//подгружаем необходимые модули
//	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');	
	grunt.loadNpmTasks('grunt-contrib-cssmin');	
	grunt.loadNpmTasks('grunt-contrib-watch');	
	//стираем все console.log
	grunt.loadNpmTasks('grunt-remove-logging');	
	
	
	//регистрируем задачу
	grunt.registerTask('default', ['concat', 'uglify', 'cssmin', 'removelogging', 'watch']);
	grunt.registerTask('test', ['']);
};