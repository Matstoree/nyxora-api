const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports = function (app) {
    app.get('/maker/fakecall', async (req, res) => {
        const { apikey, nama, durasi, image } = req.query;

        // Validasi apikey
        if (!apikey)
            return res.json({ status: false, error: 'Apikey required' });

        if (!global.apikey || !global.apikey.includes(apikey))
            return res.json({ status: false, error: 'Apikey invalid' });

        // Validasi parameter
        if (!nama || !durasi || !image) {
            return res.json({
                status: false,
                error: 'Parameter nama, durasi, image wajib diisi'
            });
        }

        try {
            // Load avatar & background
            const avatar = await loadImage(image);
            const bg = await loadImage('https://c.top4top.io/p_3675bgyhy1.jpg');

            const canvas = createCanvas(720, 1280);
            const ctx = canvas.getContext('2d');

            // Background
            ctx.drawImage(bg, 0, 0, 720, 1280);

            ctx.textAlign = 'center';

            // Nama
            ctx.font = 'bold 42px sans-serif';
            ctx.fillStyle = 'white';
            ctx.fillText(nama.trim(), 360, 150);

            // Durasi
            ctx.font = '30px sans-serif';
            ctx.fillStyle = '#d1d1d1';
            ctx.fillText(durasi.trim(), 360, 200);

            // Avatar bulat
            ctx.save();
            ctx.beginPath();
            ctx.arc(360, 635, 160, 0, Math.PI * 2);
            ctx.closePath();
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
