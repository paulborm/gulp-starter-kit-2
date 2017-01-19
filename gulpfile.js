var gulp            = require('gulp');
var rename          = require('gulp-rename');
var concat          = require('gulp-concat');
var uglify          = require('gulp-uglify');
var htmlPrettify    = require('gulp-html-prettify');
var imagemin        = require('gulp-imagemin');
var cache           = require('gulp-cache');
var nunjucks        = require('gulp-nunjucks');
var data            = require('gulp-data');
var path            = require('path');
var fs              = require('fs');
var critical        = require('critical');
var browserSync     = require('browser-sync').create();

// postCSS shit
var postcss                   = require('gulp-postcss');
var postcss_cssnext           = require('postcss-cssnext');
var postcss_import            = require('postcss-import');
var postcss_clean             = require('postcss-clean');
var postcss_discardComments   = require('postcss-discard-comments');


var folderSrc       = "./src";
var folderDest      = "./dist";


/*#####################################################################*/
/*#######                  INHALTSVERZEICHNIS                   #######*/
/*#####################################################################*/

//  1. Image optimisation
//  2. Styles
//  3. Scripts
//  4. Nunjucks (Templating)
//  5. Copy (From root)
//  6. Fonts
//  7. Build
//  8. Serve
//  9. Default (Build then Serve)






/*#####################################################################*/
/*#######                 1. IMAGE OPTIMIZATION                 #######*/
/*#####################################################################*/


gulp.task('images', function(){
  gulp.src([
      'src/images/**/*.jpg', 
      'src/images/**/*.jpeg',
      'src/images/**/*.png',
      'src/images/**/*.gif',
      'src/images/**/*.svg'])
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest('dist/images/'))
});

// WATCH TASK
gulp.task('images-watch', ['images'], function() {
  browserSync.reload();
}); 






/*#####################################################################*/
/*#######                      2. STYLES                         #######*/
/*#####################################################################*/


gulp.task('styles', function(){
  gulp.src(['src/styles/main.css'])

    .pipe(postcss([
      postcss_import(),
      postcss_cssnext(),
      postcss_discardComments()
    ]))
    .pipe(gulp.dest(folderDest + '/styles/'))


    .pipe(rename({suffix: '.min'}))
    .pipe(postcss([
      postcss_clean()
    ]))
    .pipe(gulp.dest(folderDest + '/styles/'))


    .pipe(browserSync.stream());

});









/*#####################################################################*/
/*#######                    Critical CSS                      #######*/
/*#####################################################################*/ 


gulp.task('critical', function() {
    critical.generate({
        // inline critical-css in html
        inline: true,
        // base directory - source and destination
        base: 'dist/',
        // file which will be executed
        src: 'index.html',
        // where to output
        dest: 'index.html',
        minify: true,
        // optimize for this viewport
        width: 414,
        height: 736
    });
});









/*#####################################################################*/
/*#######                     3. SCRIPTS                        #######*/
/*#####################################################################*/


gulp.task('scripts-normal', function(){
  return gulp.src(['src/scripts/*.js'])
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
    }}))
    .pipe(gulp.dest('dist/scripts/'))
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('dist/scripts/'))
});

// WATCH TASK
gulp.task('scripts-normal-watch', ['scripts-normal'], function() {
  browserSync.reload();
}); 


gulp.task('scripts-vendor', function() {
  return gulp.src(['src/scripts/vendor/**/*.js'])
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
    }}))
    .pipe(gulp.dest('dist/scripts/vendor'))
});

// WATCH TASK
gulp.task('scripts-vendor-watch', ['scripts-vendor'], function() {
  browserSync.reload();
});  
 

gulp.task('scripts', ['scripts-normal', 'scripts-vendor']);







/*#####################################################################*/
/*#######              3.1 SCRIPTS Global Plugins               #######*/
/*#####################################################################*/
/*
Combines globally used scripts
*/

gulp.task('scripts-vendor-global', function(){
  return gulp.src([
      'src/scripts/vendor/jquery-1.12.0.min.js'
    ])
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
    }}))
    .pipe(concat('vendor-global.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/scripts/vendor'))
});









/*#####################################################################*/
/*#######           4. NUNJUCKS (HTML, TEMPLATES)               #######*/
/*#####################################################################*/


gulp.task('nunjucks', function() {
    return gulp.src('src/*.html')

      // Adding data to Nunjucks 
      .pipe(data(function() {
        return JSON.parse(fs.readFileSync('./src/data/data.json'));
      }))

      /*
      .pipe(data(function() {
        return JSON.parse(fs.readFileSync('./src/data/other-data-file.json'));
      }))
      */

      .pipe(nunjucks.compile())
      .pipe(gulp.dest('dist'))
});


// WATCH TASK
gulp.task('nunjucks-watch', ['nunjucks'], function() {
  browserSync.reload();
});    

// WATCH TASK
gulp.task('data-watch', ['nunjucks'], function() {
  browserSync.reload();
});    




/*#####################################################################*/
/*#######             5. COPY (FILES FROM ROOT)                 #######*/
/*#####################################################################*/


gulp.task('copy', function() {
   gulp.src(['src/*.ico', 'src/.htaccess'])
   .pipe(gulp.dest('dist'))
});

// WATCH TASK
gulp.task('copy-watch', ['copy'], function() {
  browserSync.reload();
});










/*#####################################################################*/
/*#######              7. BUILD (BUILD WEBSITE)                 #######*/
/*#####################################################################*/ 


gulp.task('build', ['nunjucks', 'styles', 'scripts', 'images', 'copy']);








/*#####################################################################*/
/*#######             8. SERVE (CREATE SERVER)                  #######*/
/*#####################################################################*/


gulp.task('serve', function() {
  browserSync.init({
    ghostMode: false,
    port: "3000",
    proxy: "localhost",
    serveStatic: [folderDest],
    serveStaticOptions: {
      extensions: ["html"]
    }
  });
  gulp.watch(['src/*.html', 'src/parts/**/*.html'], ['nunjucks-watch']);
  gulp.watch('src/data/**/*.json', ['data-watch']);
  gulp.watch(folderSrc + '/styles/**/*.css', ['styles']);
  gulp.watch('src/scripts/*.js', ['scripts-normal-watch']);
  gulp.watch('src/scripts/vendor/**/*.js', ['scripts-vendor-watch']);
  gulp.watch('src/images/**/*', ['images-watch']);
  gulp.watch(['src/*.ico', 'src/.htaccess'], ['copy-watch']);
});






/*#####################################################################*/
/*#######            9. DEFAULT - BUILD AND SERVE               #######*/
/*#####################################################################*/ 


gulp.task('default', ['build', 'serve']);


