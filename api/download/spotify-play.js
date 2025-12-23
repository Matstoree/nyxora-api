const axios = require("axios");

module.exports = function (app) {
  app.get("/download/spotify-play", async (req, res) => {
    try {
      const { apikey, url, q } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!url && !q) {
        return res.json({
          status: false,
          error: "Url atau query tidak boleh kosong"
        });
      }

      const input = url || q;

      const { data: s } = await axios.get(
        `https://spotdown.org/api/song-details?url=${encodeURIComponent(input)}`,
        {
          headers: {
            origin: "https://spotdown.org",
            referer: "https://spotdown.org/",
            "user-agent":
              "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36"
          }
        }
      );

      if (!s || !s.songs || s.songs.length === 0) {
        return res.json({
          status: false,
          error: "Track tidak ditemukan"
        });
      }

      const song = s.songs[0];

      const { data: dl } = await axios.post(
        "https://spotdown.org/api/download",
        { url: song.url },
        {
          headers: {
            origin: "https://spotdown.org",
            referer: "https://spotdown.org/",
            "user-agent":
              "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36"
          }
        }
      );

      if (!dl || !dl.data || !dl.data.url) {
        return res.json({
          status: false,
          error: "Gagal mendapatkan audio url"
        });
      }

      res.json({
        status: true,
        creator: "Matstoree",
        metadata: {
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          cover: song.thumbnail
        },
        audio: dl.data.url
      });
    } catch (err) {
      res.json({
        status: false,
        error: err.message
      });
    }
  });
};
