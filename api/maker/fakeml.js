const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports = function (app) {
  app.get('/maker/fakeml', async (req, res) => {
    const { apikey, nickname, image } = req.query;

    if (!apikey)
      return res.json({ status: false, error: 'Apikey required' });

    if (!global.apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: 'Apikey invalid' });

    if (!nickname || !image)
      return res.json({ status: false, error: 'Nickname & image required' });

    try {
      const bg = await loadImage('https://files.catbox.moe/liplnf.jpg');
      const frame = await loadImage('https://files.catbox.moe/2vm2lt.png');
      const avatar = await loadImage(image);

      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      const avatarSize = 205;
      const frameSize = 293;
      const centerX = (canvas.width - frameSize) / 2;
      const centerY = (canvas.height - frameSize) / 2 - 282;
      const avatarX = centerX + (frameSize - avatarSize) / 2;
      const avatarY = centerY + (frameSize - avatarSize) / 2 - 3;

      const minSide = Math.min(avatar.width, avatar.height);
      const cropX = (avatar.width - minSide) / 2;
      const cropY = (avatar.height - minSide) / 2;

      ctx.drawImage(
        avatar,
        cropX,
        cropY,
        minSide,
        minSide,
        avatarX,
        avatarY,
        avatarSize,
        avatarSize
      );

      ctx.drawImage(frame, centerX, centerY, frameSize, frameSize);

      let fontSize = 36;
      if (nickname.length > 11) {
        fontSize -= (nickname.length - 11) * 2;
        if (fontSize < 24) fontSize = 24;
      }

      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';

      const textX = canvas.width / 2 + 13;
      const textY = centerY + frameSize + 15;
      const maxWidth = frameSize + 60;

      let drawName = nickname.trim();
      if (ctx.measureText(drawName).width > maxWidth) {
        for (let i = drawName.length; i > 0; i--) {
          const sub = drawName.slice(0, i) + '…';
          if (ctx.measureText(sub).width <= maxWidth) {
            drawName = sub;
            break;
          }
        }
      }

      ctx.fillText(drawName, textX, textY);

      const buffer = canvas.toBuffer('image/png');

      res.setHeader('Content-Type', 'image/png');
      res.end(buffer);

    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};
