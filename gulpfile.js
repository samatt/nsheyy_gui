var gulp = require('gulp');
var NwBuilder = require('node-webkit-builder');
var fs = require('fs');

function build (cb) {
  var nw = new NwBuilder({
    version: '0.10.2',
    buildType: 'versioned',
    files: [ './public/**'],
    buildDir: './dist',
    platforms: ['osx']
  });


  nw.on('log', console.log);

  nw.build().then(function () {
    fs.renameSync(binaryDir + '/node-webkit.app', binaryDir + '/nsheyyy.app');
    console.log('Build created');
    cb();
  }).catch(function (error) {
    console.error(error);
  });

}

gulp.task('build', build);


