// WORLD.EXE — orchestrates the scenes and the final "camera" grade.
// WX.renderAt(t) draws one frame deterministically, so the same code drives the live player
// and the frame-accurate offline render.
(function () {
  const WX = window.WX;
  const T = window.WX_TIMELINE.cues;

  let canvas, ctx, ready = false, scale = 1;

  function grade(ctx) {
    // paper tooth (shifts a hair on each boil frame, like a cel re-registered under the camera)
    const b = WX.frame.boil;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.55;
    ctx.drawImage(WX.texPaper, (b % 3) - 2, ((b * 7) % 3) - 2, WX.W + 4, WX.H + 4);
    ctx.restore();
    // warm vignette
    const g = ctx.createRadialGradient(960, 540, 520, 960, 540, 1250);
    g.addColorStop(0, 'rgba(60,30,20,0)');
    g.addColorStop(1, 'rgba(60,30,20,0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WX.W, WX.H);
  }

  function renderAt(t) {
    if (!ready) return;
    WX.setTime(t);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#f7e9c9';
    ctx.fillRect(0, 0, WX.W, WX.H);

    const tB = T.newLand - 0.08; // B is revealed through the swooping mountain
    if (t < T.newLand + 0.06) WX.sceneA.draw(ctx, t);
    if (WX.sceneB && t >= tB && t < T.curlStart + 0.02) WX.sceneB.draw(ctx, t);
    if (WX.sceneC && t >= T.curlStart) WX.sceneC.draw(ctx, t);

    grade(ctx);
  }

  // scale < 1 renders the same drawing into a smaller canvas (used by the live player)
  async function init(cv, opts = {}) {
    canvas = cv;
    scale = opts.scale || 1;
    canvas.width = Math.round(WX.W * scale);
    canvas.height = Math.round(WX.H * scale);
    ctx = canvas.getContext('2d');
    if (WX.loadFonts) await WX.loadFonts();
    WX.buildTextures();
    if (WX.sceneC && WX.sceneC.init) WX.sceneC.init();
    ready = true;
  }

  WX.init = init;
  WX.renderAt = renderAt;
  WX.duration = window.WX_TIMELINE.duration;
})();
