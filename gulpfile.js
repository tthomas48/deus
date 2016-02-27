"use strict";

var gulp = require('gulp');
var less = require('gulp-less'),
    path = require('path'),
    clean = require('gulp-clean'),
    watch = require('gulp-watch'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream');


gulp.task('clean', function() {
  return gulp.src('./public', {read: false})
    .pipe(clean());
});

gulp.task('less', function () {
  gulp.src(['./app/less/deus.less'])
    .pipe(watch(['./app/less/*.less', './app/stylesheets/*.css']))
    .pipe(less({
      paths: [
        './app',
        './node_modules'
      ]
     }))
    .pipe(gulp.dest('./public/css/'));
});

gulp.task('html', function() {
  gulp.src(['./app/**/*.html'])
    .pipe(watch('./app/**/*.html'))
    .pipe(gulp.dest('./public/'));
});

gulp.task('bower', function() {
  gulp.src(['./bower_components/**/*'])
    .pipe(gulp.dest('./public/components/'));
});

gulp.task('copy', function() {
  "use strict";

});

gulp.task('browserify', function() {
  return browserify([
      './app/javascripts/deus.js',
      './app/javascripts/controller/cuemap.js',
      './app/javascripts/controller/eventlist.js',
      './app/javascripts/controller/performancelist.js',
      './app/javascripts/olympus.js',
      './app/javascripts/util.js'
    ])
    .bundle()
    .pipe(watch('/app/javascripts/**/*.js'))
    //Pass desired output filename to vinyl-source-stream
    .pipe(source('bundle.js'))
    // Start piping stream to tasks!
    .pipe(gulp.dest('./public/js/'));
});

gulp.task('server', function() {
    require('./server.js');
});

gulp.task('watch', function() {
  gulp.watch(['app/less/**/*.less', 'app/stylesheets/**/*.css'], ['less']);
  gulp.watch(['app/**/*.html'], ['html']);
  gulp.watch(['bower_components//**/*'], ['bower']);
});

gulp.task('default', ['less', 'html', 'browserify', 'bower', 'server']);
