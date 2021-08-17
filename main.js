/*
Deobfuscation by @lexfridman C++ Source:
https://www.dropbox.com/s/79ga2m7p2bnj1ga/donut_deobfuscated.c?dl=0

Original (and much more beautiful) + explanation:
https://www.a1k0n.net/2011/07/20/donut-math.html

JS translation and general ugliness and bad practice: patrickoliveras@gmail.com

Refactored by kenny@yeoyou.net
*/

class Donut {
  constructor(config) {
    const c = { shades: '.,-~:;=!*#$@', ...config };
    if (!Array.isArray(c.shades)) c.shades = c.shades.split('');
    c.outputArea = c.outputWidth * c.outputHeight;
    this._config = c;
    this._lastage = new Date().getTime();
    this._context = { radYaw: 0, radPitch: 0, buffer: Array(c.outputArea), zbuffer: Array(c.outputArea) };
  }

  renderText() {
    const {
      _context: ctx,
      _config: { outputWidth, outputHeight, shades },
    } = this;
    const pattern = [' ', ...shades];
    const lines = [];
    for (let i = 0; i < outputHeight; i++) {
      lines.push(
        ctx.buffer
          .slice(i * outputWidth, (i + 1) * outputWidth)
          .map(level => pattern[level])
          .join('')
      );
    }
    return lines.join('\n');
  }

  updateBuffers() {
    const {
      xOffset,
      yOffset,
      what,
      fov,
      innerRadius,
      outputArea,
      outputWidth,
      outputHeight,
      r1Points,
      r2Points,
      shades,
    } = this._config;
    const shadeConstant = ((shades.length + 1) * 2 / 3) << 0; // ceil(shade.length * (2/3))
    const ctx = this._context;

    ctx.buffer.fill(0);
    ctx.zbuffer.fill(0); // z-buffer set to z^-1

    const range = 6.28;
    for (let j = 0; j < range; j += range / r1Points) {
      for (let i = 0; i < range; i += range / r2Points) {
        const c = Math.sin(i);
        const d = Math.cos(j);
        const e = Math.sin(ctx.radYaw);
        const f = Math.sin(j);
        const g = Math.cos(ctx.radYaw);

        const h = d + innerRadius;

        const D = 1 / (c * h * e + f * g + fov);

        const l = Math.cos(i);
        const m = Math.cos(ctx.radPitch);
        const n = Math.sin(ctx.radPitch);
        const t = c * h * g - f * e;

        // floored floats a.k.a. ints
        const x = (xOffset + what * D * (l * h * m - t * n)) << 0;
        if (x <= 0 || outputWidth <= x) continue;
        const y = (yOffset + (what / 2) * D * (l * h * n + t * m)) << 0;
        if (y <= 0 || outputHeight <= y) continue;

        const index = (x + outputWidth * y) << 0;
        if (D > ctx.zbuffer[index]) {
          ctx.zbuffer[index] = D;
          const level = Math.max(shadeConstant * ((f * e - c * d * g) * m - c * d * e - f * g - l * d * n), 0);
          ctx.buffer[index] = level << 0;
        }
      }
    }
  }

  age(fps, factor = 1) {
    const now = new Date().getTime();
    const past = (now - this._lastage) / 1000;
    const diff = past * fps / 1000 * factor * 10;
    this._context.radPitch += diff;
    this._context.radYaw += diff * 1.7;
    this._lastage = now;
  }
}

const outputElement = document.querySelector('#pre');

const donutInstance = new Donut({
  outputWidth: 120,
  outputHeight: 30,
  yOffset: 12,
  xOffset: 40,
  innerRadius: 2,
  r1Points: 90,
  r2Points: 314,
  fov: 4,
  what: 30,
});

const fps = 30;
const h = setInterval(() => {
  try {
    donutInstance.age(fps, 8);
    donutInstance.updateBuffers();
    outputElement.innerHTML = donutInstance.renderText();
  } catch (e) {
    console.error(e);
    clearTimeout(h);
  }
}, 1000 / fps);
