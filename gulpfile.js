const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const cssnano = require('gulp-cssnano');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const inject = require('gulp-inject');
const fs = require('fs');
const javascriptObfuscator = require('gulp-javascript-obfuscator');
const replace = require('gulp-replace');
const htmlReplace = require('gulp-html-replace');
const del = require('del');

// Clean task
gulp.task('clean', function() {
    return del(['dist']);
});

// Minify and concatenate CSS
gulp.task('minify-css', () => {
    console.log('Minifying CSS...');
    return gulp.src('src/styles/*.css')
        .pipe(cssnano())
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('dist/styles'));
});

// Minify, obfuscate, and concatenate JS
gulp.task('minify-js', () => {
    console.log('Minifying and obfuscating JS...');
    return gulp.src('src/scripts/*.js')
        .pipe(replace('// inject:hostname-check', `
            if (window.location.hostname !== 'ganttris.com') {
                alert('This page can only be accessed from ganttris.com');
                window.location.href = 'https://ganttris.com';
            }
        `))
        .pipe(javascriptObfuscator())
        .pipe(uglify())
        .pipe(concat('script.min.js'))
        .pipe(gulp.dest('dist/scripts'));
});

// Minify HTML and inject references
gulp.task('html', function() {
    return gulp.src('src/*.html')
        .pipe(htmlReplace({
            'css': 'styles/style.min.css',
            'js': 'scripts/script.min.js'
        }))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist'));
});

// Copy other assets (if any)
gulp.task('copy-assets', () => {
    console.log('Copying assets...');
    return gulp.src('src/assets/**/*')
        .pipe(gulp.dest('dist/assets'));
});

// Create .nojekyll file
gulp.task('create-nojekyll', (done) => {
    console.log('Creating .nojekyll file...');
    fs.writeFileSync('dist/.nojekyll', '');
    done();
});

// Create CNAME file
gulp.task('create-cname', (done) => {
    console.log('Creating CNAME file...');
    fs.writeFileSync('dist/CNAME', 'ganttris.com'); // Replace with your custom domain
    done();
});

// Cache busting
gulp.task('cache-bust', function () {
    const timestamp = new Date().getTime();
    return gulp.src('src/index.html')
        .pipe(htmlReplace({
            'css': `styles/style.min.css?v=${timestamp}`,
            'js': `scripts/script.min.js?v=${timestamp}`
        }))
        .pipe(gulp.dest('dist'));
});

// Delete unminified files
gulp.task('delete-unminified', function() {
    return del(['dist/styles/style.css', 'dist/scripts/script.js']);
});

// Scripts task
gulp.task('scripts', function() {
    return gulp.src('src/scripts/**/*.js')
        .pipe(concat('script.js'))
        .pipe(gulp.dest('dist/scripts'))
        .pipe(rename('script.min.js'))
        .pipe(javascriptObfuscator())
        .pipe(uglify())
        .pipe(gulp.dest('dist/scripts'));
});

// Styles task
gulp.task('styles', function() {
    return gulp.src('src/styles/**/*.css')
        .pipe(concat('style.css'))
        .pipe(gulp.dest('dist/styles'))
        .pipe(rename('style.min.css'))
        .pipe(cssnano())
        .pipe(gulp.dest('dist/styles'));
});

// Build task
gulp.task('build', gulp.series('clean', 'scripts', 'styles', 'html', 'minify-css', 'minify-js', 'copy-assets', 'create-nojekyll', 'create-cname', 'cache-bust', 'delete-unminified'));

// Default task
gulp.task('default', gulp.series('build', (done) => {
    console.log('Build process completed.');
    done();
}));