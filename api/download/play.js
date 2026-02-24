const axios = require("axios");
const yts = require("yt-search");

module.exports = function (app) {

  async function getYouTubeMp3(youtubeUrl) {
    const videoId =
      youtubeUrl.split('be/')[1]?.split('?')[0] ||
      youtubeUrl.split('v=')[1]?.split('&')[0];

    if (!videoId) throw new Error("Invalid YouTube URL");

    const ajaxUrl = 'https://ssyoutube.online/wp-admin/admin-ajax.php';

    const step1Payload = new URLSearchParams();
    step1Payload.append('action', 'get_mp3_yt_option');
    step1Payload.append('videoId', videoId);

    const response1 = await axios.post(ajaxUrl, step1Payload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response1.data.success || !response1.data.data.link) {
      throw new Error("Failed to get raw mp3 link");
    }

    const rawMp3Link = response1.data.data.link;
    const videoTitle = response1.data.data.title;

    const step2Payload = new URLSearchParams();
    step2Payload.append('action', 'mp3_yt_generic_proxy_ajax');
    step2Payload.append('targetUrl', rawMp3Link);

    const response2 = await axios.post(ajaxUrl, step2Payload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response2.data.success || !response2.data.data.proxiedUrl) {
      throw new Error("Failed to proxy mp3 link");
    }

    return {
      title: videoTitle,
      duration: 0,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      download: response2.data.data.proxiedUrl
    };
  }

  app.get('/download/play', async (req, res) => {
    try {
      const { apikey, q } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: 'Apikey invalid'
        });
      }

      if (!q) {
        return res.json({
          status: false,
          error: 'Query tidak boleh kosong'
        });
      }

      const searchResult = await yts(q);

      if (!searchResult || !searchResult.videos || searchResult.videos.length === 0) {
        return res.json({
          status: false,
          error: 'Video tidak ditemukan'
        });
      }

      const video = searchResult.videos[0];
      const result = await getYouTubeMp3(video.url);

      res.json({
        status: true,
        creator: 'Matstoree',
        metadata: {
          title: result.title,
          channel: video.author.name,
          duration: video.seconds,
          cover: result.thumbnail,
          url: video.url
        },
        audio: result.download
      });

    } catch (e) {
      res.json({
        status: false,
        error: e.message
      });
    }
  });
};
