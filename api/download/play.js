const axios = require("axios");
const crypto = require("crypto");
const yts = require("yt-search");

const anu = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex');

function decrypt(enc) {
  const b = Buffer.from(enc.replace(/\s/g, ''), 'base64');
  const iv = b.subarray(0, 16);
  const data = b.subarray(16);
  const d = crypto.createDecipheriv('aes-128-cbc', anu, iv);
  return JSON.parse(Buffer.concat([d.update(data), d.final()]).toString());
}

async function savetube(url) {
  try {
    const random = await axios.get('https://media.savetube.vip/api/random-cdn', {
      headers: {
        origin: 'https://save-tube.com',
        referer: 'https://save-tube.com/',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const cdn = random.data.cdn;

    const info = await axios.post(`https://${cdn}/v2/info`,
      { url },
      {
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://save-tube.com',
          referer: 'https://save-tube.com/',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    if (!info.data || !info.data.status) return { status: false };

    const json = decrypt(info.data.data);

    async function download(type, quality) {
      const r = await axios.post(`https://${cdn}/download`,
        {
          id: json.id,
          key: json.key,
          downloadType: type,
          quality: String(quality)
        },
        {
          headers: {
            'Content-Type': 'application/json',
            origin: 'https://save-tube.com',
            referer: 'https://save-tube.com/',
            'User-Agent': 'Mozilla/5.0'
          }
        }
      );
      return r.data && r.data.data ? r.data.data.downloadUrl : null;
    }

    // Cari audio format dengan quality 128 (MP3)
    const audioFormat = json.audio_formats.find(a => a.quality === 128);
    
    if (!audioFormat) {
      return { status: false, error: "Audio MP3 tidak tersedia" };
    }

    const audioUrl = await download('audio', 128);

    return {
      status: true,
      title: json.title,
      duration: json.duration,
      thumbnail: json.thumbnail,
      audio: audioUrl
    };

  } catch (error) {
    return { status: false, error: error.message };
  }
}

module.exports = function (app) {
  app.get("/download/play", async (req, res) => {
    try {
      const { apikey, q } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!q) {
        return res.json({
          status: false,
          error: "Query tidak boleh kosong"
        });
      }

      // Search YouTube menggunakan yt-search
      const searchResult = await yts(q);
      
      if (!searchResult || !searchResult.videos || searchResult.videos.length === 0) {
        return res.json({
          status: false,
          error: "Video tidak ditemukan"
        });
      }

      const video = searchResult.videos[0];

      // Download audio menggunakan savetube
      const result = await savetube(video.url);

      if (!result.status) {
        return res.json({
          status: false,
          error: result.error || "Gagal mendownload audio"
        });
      }

      res.json({
        status: true,
        creator: "Matstoree",
        metadata: {
          title: result.title,
          channel: video.author.name,
          duration: result.duration,
          cover: result.thumbnail,
          url: video.url
        },
        audio: result.audio
      });

    } catch (e) {
      res.json({
        status: false,
        error: e.message
      });
    }
  });
};
