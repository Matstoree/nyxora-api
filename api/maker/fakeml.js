const { createCanvas, loadImage } = require('@napi-rs/canvas');
const axios = require('axios');

module.exports = function (app) {
  app.get('/maker/fakeml', async (req, res) => {
    const { apikey, nickname, image } = req.query;

    if (!apikey)
      return res.json({ status: false, error: 'Apikey required' });

    if (!global.apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: 'Apikey invalid' });

    if (!nickname)
      return res.json({ status: false, error: 'Nickname required' });

    if (!image)
      return res.json({ status: false, error: 'Image URL required' });

    try {
      const bg = await loadImage('https://files.catbox.moe/liplnf.jpg');
      const frameOverlay = await loadImage('https://files.catbox.moe/2vm2lt.png');
      const userImage = await loadImage(image);

      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      const avatarSize = 205;
      const frameSize = 293;
      const centerX = (canvas.width - frameSize) / 2;
      const centerY = (canvas.height - frameSize) / 2 - 282;
      const avatarX = centerX + (frameSize - avatarSize) / 2;
      const avatarY = centerY + (frameSize - avatarSize) / 2 - 3;

      const { width, height } = userImage;
      const minSide = Math.min(width, height);
      const cropX = (width - minSide) / 2;
      const cropY = (height - minSide) / 2;

      ctx.drawImage(
        userImage,
        cropX,
        cropY,
        minSide,
        minSide,
        avatarX,
        avatarY,
        avatarSize,
        avatarSize
      );

      ctx.drawImage(frameOverlay, centerX, centerY, frameSize, frameSize);

      const maxFontSize = 36;
      const minFontSize = 24;
      const maxChar = 11;
      let fontSize = maxFontSize;

      if (nickname.length > maxChar) {
        const excess = nickname.length - maxChar;
        fontSize -= excess * 2;
        if (fontSize < minFontSize) fontSize = minFontSize;
      }

      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';

      const textX = canvas.width / 2 + 13;
      const textY = centerY + frameSize + 15;

      const metrics = ctx.measureText(nickname);
      const maxWidth = frameSize + 60;
      let drawName = nickname;

      if (metrics.width > maxWidth) {
        for (let len = nickname.length; len > 0; len--) {
          const sub = nickname.slice(0, len) + '…';
          if (ctx.measureText(sub).width <= maxWidth) {
            drawName = sub;
            break;
          }
        }
      }

      ctx.fillText(drawName, textX, textY);

      const buffer = canvas.toBuffer('image/png');

      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);

    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  });
};
