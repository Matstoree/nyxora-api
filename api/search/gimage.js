module.exports = function(app) {
app.get('/search/gimage', async (req, res) => {
        try {
            const { apikey } = req.query;
    if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' })
    const { q } = req.query;
    if (!q) return res.json({ status: false, error: 'https://api.ryzumi.vip/api/search/gimage?query=${q}`);  
            res.status(200).json({
                status: true,
                result: results.result
            });
        } catch (error) {
            res.status(500).send(`Error: ${error.message}`);
        }
});

};

