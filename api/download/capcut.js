const axios = require('axios');

async function capcutdl(url) {
    try {
        const { data } = await axios.post(
            'https://3bic.com/api/download',
            { url },
            {
                headers: {
                    "content-type": "application/json",
                    "origin": "https://3bic.com",
                    "referer": "https://3bic.com/",
                    "user-agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/133.0.0.0 Mobile Safari/537.36"
                }
            }
        );

        if (!data || !data.originalVideoUrl) {
            throw new Error('Gagal mengambil data video');
        }

        return {
            ...data,
            originalVideoUrl: 'https://3bic.com' + data.originalVideoUrl
        };
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    app.get('/download/capcut', async (req, res) => {
        const { apikey, url } = req.query;

        if (!apikey) return res.json({ status: false, error: 'Apikey required' });
        if (!global.apikey.includes(apikey))
            return res.json({ status: false, error: 'Apikey invalid' });

        if (!url)
            return res.json({ status: false, error: 'Url is required' });

        try {
            const result = await capcutdl(url);
            res.status(200).json({
                status: true,
                result
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                error: error.message
            });
        }
    });
};
