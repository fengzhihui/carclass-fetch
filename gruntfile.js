module.exports = function (grunt) {

    grunt.initConfig({
        watch: {
            jade: {
                files: ['views/**'],
                options: {
                    livereload: true//重启服务,什么服务?
                }
            },
            js: {
                files: ['public/js/**', 'models/**/*.js', 'schemas/**/*.js'],
                //tasks: ['jshint'], 语法检查
                options: {
                    livereload: true
                }
            }
        },
        nodemon: {
            dev: {
                script: 'app.js',//入口文件
                options: {
                    args: [],
                    ignoredFiles: ['README.md', 'node_modules/**', 'npm-debug.log'],
                    watchedExtensions: ['js'],
                    watchedFolders: ['./'], //['app', 'config']
                    debug: true,
                    delayTime: 1,//如果有大批量文件需要编译,不会因为每个文件改动都会重启一次, 二十等待多少时间后重启服务.
                    env: {
                        PORT: 3000
                    },
                    cwd: __dirname//当前目录
                }
            }
        },
        concurrent: {//任务入口
            tasks: ['nodemon', 'watch'],
            options: {
                logConcurrentOutput: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');//有文件更新, 重新执行注册的任务
    grunt.loadNpmTasks('grunt-nodemon');//实时监听app.js入口文件
    grunt.loadNpmTasks('grunt-concurrent');//针对于慢任务开发,如coffeescript..

    grunt.option('force', true);//便于开发的时候不要因为语法的错误,警告中断grunt的任务.
    grunt.registerTask('default', ['concurrent']);//注册任务
}























