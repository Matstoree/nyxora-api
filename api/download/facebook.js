const axios = require('axios');
const cheerio = require('cheerio');

async function facebook(url) {
    if (!/facebook\.\w+\/(reel|watch|share|video)/gi.test(url)) {
        throw new Error("Invalid URL, Enter A Valid Facebook Video URL")
    }
    
    try {
        // Menggunakan token dan exp yang sudah diketahui
        const data = new URLSearchParams();
        data.append('k_exp', '1719382502');
        data.append('k_token', 'caff0706549d24c12d4e8a6ba2f350b3785d3cff2864c26b25007513146eb455');
        data.append('q', url);
        data.append('lang', 'id');
        data.append('web', 'fdownloader.net');
        data.append('v', 'v2');
        data.append('w', '');
        
        const response = await axios('https://v3.fdownloader.net/api/ajaxSearch?lang=id', {
            method: 'POST',
            data: data.toString(),
            headers: {
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Origin': 'https://fdownloader.net',
                'Referer': 'https://fdownloader.net/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
            },
            timeout: 30000
        });
        
        const html = response?.data?.data || '';
        const $ = cheerio.load(html);
        
        // Ekstrak informasi video
        const title = $('.thumbnail > .content > .clearfix > h3').text().trim() || 
                     $('h3').first().text().trim() || '';
        const duration = $('.thumbnail > .content > .clearfix > p').text().trim() || 
                        $('p').first().text().trim() || '';
        const thumbnail = $('.thumbnail > .image-fb > img').attr('src') || 
                         $('img').first().attr('src') || '';
        
        // Ekstrak link video dengan kualitas
        const video = [];
        $('.download-link-fb').each((i, el) => {
            const videoUrl = $(el).attr('href') || null;
            const quality = $(el).attr('title') || $(el).text().trim() || '';
            if (videoUrl && videoUrl !== '#note_convert') {
                video.push({
                    quality: quality,
                    url: videoUrl
                });
            }
        });
        
        // Fallback jika tidak ada video ditemukan
        if (video.length === 0) {
            $('a[href*="http"]').each((i, el) => {
                const href = $(el).attr('href');
                const text = $(el).text().trim();
                if (href && href.includes('video') && !href.includes('fdownloader')) {
                    video.push({
                        quality: text || 'Unknown',
                        url: href
                    });
                }
            });
        }
        
        // Cari media/audio jika ada
        const media = $('#popup_play > .popup-body > .popup-content > #vid').attr('src') || 
                     $('video').first().attr('src') || '';
        const music = $('#fbdownloader').find('#audioUrl').attr('value') || 
                     $('input[type="hidden"]').filter((i, el) => {
                         return $(el).attr('value')?.includes('audio');
                     }).first().attr('value') || '';
        
        const details = {
            title: title,
            duration: duration,
            thumbnail: thumbnail,
            media: media,
            video: video,
            music: music
        };
        
        return details;
    } catch (error) {
        throw error;
    }
}

module.exports = function (app) {
    app.get('/download/facebook', async (req, res) => {
        const { apikey } = req.query;
        if (!global.apikey.includes(apikey)) {
            return res.json({ status: false, error: 'Apikey invalid' });
        }
        const { url } = req.query;
        if (!url) {
            return res.json({ status: false, error: 'Url is required' });
        }
        try {
            const results = await facebook(url);
            res.status(200).json({
                status: true,
                result: results
            });
        } catch (error) {
            res.status(500).json({ 
                status: false, 
                error: error.message 
            });
        }
    });
}
