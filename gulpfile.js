const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const cssnano = require('gulp-cssnano');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const inject = require('gulp-inject');

// Minify and concatenate CSS
gulp.task('minify-css', () => {
    console.log('Minifying CSS...');
    return gulp.src('src/styles/*.css')
        .pipe(cssnano())
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('dist/styles'));
});

// Minify and concatenate JS
gulp.task('minify-js', () => {
    console.log('Minifying JS...');
    return gulp.src('src/scripts/*.js')
        .pipe(uglify())
        .pipe(concat('script.min.js'))
        .pipe(gulp.dest('dist/scripts'));
});

// Minify HTML and inject references
gulp.task('minify-html', () => {
    console.log('Minifying HTML and injecting references...');
    const target = gulp.src('src/*.html');
    const sources = gulp.src(['dist/styles/style.min.css', 'dist/scripts/script.min.js'], { read: false });

    return target
        .pipe(inject(sources, { ignorePath: 'dist', addRootSlash: false }))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist'));
});

// Copy other assets (if any)
gulp.task('copy-assets', () => {
    console.log('Copying assets...');
    return gulp.src('src/assets/**/*')
        .pipe(gulp.dest('dist/assets'));
});

// Default task
gulp.task('default', gulp.series('minify-css', 'minify-js', 'minify-html', 'copy-assets', (done) => {
    console.log('Build process completed.');
    done();
}));