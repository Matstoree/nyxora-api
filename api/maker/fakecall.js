const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports = function (app) {
    app.get('/maker/fakecall', async (req, res) => {
        const { apikey, nama, durasi, image } = req.query;

        if (!apikey)
            return res.json({ status: false, error: 'Apikey required' });

        if (!global.apikey.includes(apikey))
            return res.json({ status: false, error: 'Apikey invalid' });

        if (!nama || !durasi || !image)
            return res.json({
                status: false,
                error: 'Parameter nama, durasi, image wajib diisi'
            });

        try {
            const avatar = await loadImage(image);
            const bg = await loadImage('https://c.top4top.io/p_3675bgyhy1.jpg');

            const canvas = createCanvas(720, 1280);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(bg, 0, 0, 720, 1280);

            ctx.textAlign = 'center';

            ctx.font = 'bold 40px sans-serif';
            ctx.fillStyle = 'white';
            ctx.fillText(nama.trim(), 360, 150);

            ctx.font = '30px sans-serif';
            ctx.fillStyle = '#d1d1d1';
            ctx.fillText(durasi.trim(), 360, 200);

            ctx.save();
            ctx.beginPath();
            ctx.arc(360, 635, 160, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatar, 200, 475, 320, 320);
            ctx.restore();

            const buffer = canvas.toBuffer("image/png");

            res.setHeader('Content-Type', 'image/png');
            res.send(buffer);

        } catch (error) {
            res.status(500).json({
                status: false,
                error: error.message
            });
        }
    });
};
