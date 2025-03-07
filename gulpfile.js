const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const cssnano = require('gulp-cssnano');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const inject = require('gulp-inject');
const fs = require('fs');
const javascriptObfuscator = require('gulp-javascript-obfuscator');

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
        .pipe(uglify())
        .pipe(javascriptObfuscator())
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

// Default task
gulp.task('default', gulp.series('minify-css', 'minify-js', 'minify-html', 'copy-assets', 'create-nojekyll', 'create-cname', (done) => {
    console.log('Build process completed.');
    done();
}));