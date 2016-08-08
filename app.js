#!/usr/bin/env node

var fs = require('fs');
var util = require('util');
var path = require('path');
var less = require('less');
var watch = require('watch');
var colors = require('colors');

colors.setTheme({
  info: 'green',
  error: 'red'
});
console.info = function(title,content){
		var strDate = ("["+new Date().toTimeString()+"]").info
		console.log( strDate+ ("["+title+"]").info +" "+ content);
}
console.error = function(error){
	var strDate = ("["+new Date().toTimeString()+"]").error
	console.log( strDate+ "[error]".error +" "+ error);
}

var argv = require('optimist')
    .usage('Usage: {OPTIONS}')
	.boolean(['compress'])
    .wrap(100)
    .option('input', {
      alias: 'i',
      demand: 'i',
      desc: 'Specify input file to watch/compile.'
    })
    .option('paths', {
      alias: 'p',
      desc: 'Specify search paths for @import directives.',
	  default: []
    })
    .option('compress', {
      alias: 'c',
      desc: 'Minify CSS output.'
    })
    .option('filename', {
      alias: 'f',
      desc: 'Specify a filename, for better error messages.',
	  default: "'style.less'"
    })
    .option('directory', {
      alias: 'd',
      desc: 'Specify input directory to watch.'
    })
    .option('output', {
        alias: 'o',
        demand: 'o',
        desc: 'Specify output file path.'
    })
    .option('help', {
      alias: 'h',
      desc: 'Show this message'
    })
    .check(function(argv) {
      if (argv.help) {
        throw '';
      }
}).argv;

var LessPluginCleanCSS = require('less-plugin-clean-css'), cleanCSSPlugin = new LessPluginCleanCSS({advanced: true});
var lessc = function(lessInput, lessOutput){
	var start_time = new Date();
	less.render(lessInput,{
      paths: argv.paths instanceof Array ? argv.paths : [argv.paths],  // Specify search paths for @import directives
      filename: argv.filename, // Specify a filename, for better error messages 
	  plugins: (argv.compress?[cleanCSSPlugin]:[])  // Minify CSS output
    },
	function(error, output) {
		if (!error) {
			var fd = fs.openSync(lessOutput, "w");
			fs.writeSync(fd, output.css, 0, "utf-8");
			var end_time = new Date();
			var render_time = (end_time.valueOf() - start_time.valueOf()) +"ms";
			console.info("render",render_time.red);
			console.info("output",output_file);
		} else {
			console.error(error);
		}
	});
}					

var input_file = path.resolve(process.cwd(), argv.input);
var output_file = path.resolve(process.cwd(), argv.output);
var watch_directory = argv.directory ? path.resolve(process.cwd(), argv.directory): '';

/**
 * Compiles the less files given by the input and ouput options
 */
var compileInput = function (){
    fs.readFile(input_file, 'utf-8',function(error,data){
		if(error){  
			console.error(error);
		}else{  
			lessc(data,output_file);    
		}  
	});
}

/*
 * Check to see if we are watching a directory or just
 * a single file
 */
if (watch_directory){
	compileInput();
	
	console.info("watch",watch_directory);

    watch.watchTree(watch_directory, function(f, current,previous){
		if(current==previous) return;
        compileInput();
    });
} else {
	compileInput();
	
	console.info("watch",input_file);
    fs.watchFile(input_file, function(current, previous) {
		if(current==previous) return;
        compileInput();
    });
}
