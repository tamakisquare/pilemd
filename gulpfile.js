var gulp = require('gulp');
var uglify = require('gulp-uglify');
var webpack = require('webpack-stream');
var packager = require('electron-packager');
var _ = require('lodash');
var fs = require('fs');

gulp.task('default', function() {
  return gulp.src('src/entry.js')
    .pipe(webpack( require('./webpack.config.js') ))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js/'));
});


var BASE_OPTION = {
    dir: '.',
    overwrite: true,
    arch: 'x64',
    version: '0.37.2',
    'build-version': '0.8.3',
    'app-version': '0.8.3',
    ignore: '(node_modules\/(codemirror|highlight.js|marked|vue|vue-resource)|src|icons|releases|.idea.*|README\.md|\.DS_Store|env|gulpfile\.js|webpack\.config\.js|\.gitignore)',
    asar: true,
    prune: true
};

gulp.task('electron', function(done) {
  packager(_.defaults(_.clone(BASE_OPTION), {
    out: 'releases/darwin/',
    platform: 'darwin',
    icon: './icons/pilemd.icns',
    sign: process.env['PM_OSX_SIGN'],
    'helper-buldle-id': 'md.pile.helper',
    'app-bundle-id': 'md.pile'
  }), function() {
    done();
  });
});


gulp.task('electron-linux', function(done) {
  packager(_.defaults(_.clone(BASE_OPTION), {
    out: 'releases/linux/',
    platform: 'linux'
  }), function(err, apppath) {
    done();
    fs.writeFileSync(
      apppath[0] + '/README.md',
      fs.readFileSync('./forlinux/README.md')
    );
    fs.writeFileSync(
      apppath[0] + '/LICENSE',
      fs.readFileSync('./LICENSE')
    );
  });
});


gulp.task('electron-windows', function(done) {
  var c = _.defaults(_.clone(BASE_OPTION), {
    out: 'releases/windows/',
    platform: 'win32',
    icon: './icons/pilemd.ico'
  });
  // c['arch'] = 'ia32';
  packager(c, function() {
    done();
  });
});
