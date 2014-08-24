var gulp = require('gulp');
var NwBuilder = require('node-webkit-builder');

function build (cb) {
  var nw = new NwBuilder({
    version: '0.10.2',
    files: [ './public/**'],
    buildDir: './dist',
    platforms: ['osx'],
    macIcns: './icon.icns'
  });


  nw.on('log', console.log);

  nw.build().then(function () {
    console.log('Build created');
    cb();
  }).catch(function (error) {
    console.error(error);
  });

}

gulp.task('build', build);


