var gulp = require('gulp');
var coffee = require('gulp-coffee');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');

var paths = {
  coffee: 'public/app/**/*.coffee'
};

gulp.task('coffee', function() {
	gulp.src(paths.coffee)
	  .pipe(sourcemaps.init())
	  .pipe(coffee())
	  .pipe(concat('app.js'))
	  .pipe(sourcemaps.write())
	  .pipe(gulp.dest('public/app'));
});
// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(paths.coffee, ['coffee']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['coffee', 'watch']);