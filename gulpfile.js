const gulp = require("gulp");
const imagemin = require("gulp-imagemin");
const gm = require("gulp-gm");
const newer = require("gulp-newer");

const path = {
  hq: {
    src: "src/assets-raw/media-export/**/*.+(png|jpg|gif|svg)",
    dest: "src/assets/media/hq",
  },
  lq: {
    src: "src/assets-raw/media-export/**/*.+(png|jpg|gif|svg)",
    dest: "src/assets/media/lq",
  },
  webgl: {
    src: "src/assets-raw/webgl-export/**/*.+(png|jpg|gif|svg)",
    dest: "src/assets/webgl",
  },
};

function imagePrep(src, dest, xDim, yDim, jpgQuality = 75, pngQuality = 5) {
  return gulp
    .src(src)
    .pipe(newer(dest))
    .pipe(
      gm(function (gmfile) {
        // To keep original size, use res 0x0
        if (xDim > 0 && yDim > 0) return gmfile.resize(xDim, yDim, ">");
        else return gmfile;
      })
    )
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: jpgQuality, progressive: true }),
        imagemin.optipng({ optimizationLevel: pngQuality }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(gulp.dest(dest));
}

gulp.task("img-hq", function () {
  // For bg, use res 2560x1440
  return imagePrep(path.hq.src, path.media_hq.dest, 1920, 1080, 90);
});
gulp.task("img-lq", function () {
  return imagePrep(path.lq.src, path.media_lq.dest, 560, 320);
});
gulp.task("img-texture", function () {
  return imagePrep(path.webgl.src, path.webgl.dest, 0, 0);
});
