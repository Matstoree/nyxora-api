const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports = function (app) {
    app.get('/maker/fakecall', async (req, res) => {
        const { apikey, nama, durasi, image } = req.query;

        if (!apikey)
            return res.json({ status: false, error: 'Apikey required' });

        if (!global.apikey || !global.apikey.includes(apikey))
            return res.json({ status: false, error: 'Apikey invalid' });

        if (!nama || !durasi || !image)
            return res.json({ status: false, error: 'Parameter nama, durasi, image wajib diisi' });

        try {
            const avatar = await loadImage(image);
            const bg = await loadImage('https://c.top4top.io/p_3675bgyhy1.jpg');

            const canvas = createCanvas(720, 1280);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(bg, 0, 0, 720, 1280);

            ctx.textAlign = 'center';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 15;

            ctx.font = 'bold 60px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(nama.trim(), 360, 250);

            ctx.font = '40px Arial';
            ctx.fillStyle = '#dddddd';
            ctx.fillText(durasi.trim(), 360, 320);

            ctx.shadowBlur = 0;

            ctx.save();
            ctx.beginPath();
            ctx.arc(360, 700, 180, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 180, 520, 360, 360);
            ctx.restore();

            const buffer = canvas.toBuffer("image/png");

            res.setHeader('Content-Type', 'image/png');
            res.send(buffer);

        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
