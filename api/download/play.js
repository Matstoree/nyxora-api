const axios = require("axios");
const yts = require("yt-search");

function randomcookie() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 26; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PHPSESSID=${result}`;
}

async function getYouTubeMp3(videoUrl) {

  const params = new URLSearchParams();
  params.append("url", videoUrl);

  const headers = {
    accept: "*/*",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    cookie: randomcookie(),
    origin: "https://app.ytdown.to",
    referer: "https://app.ytdown.to/en16/",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/145.0.0.0 Safari/537.36",
    "x-requested-with": "XMLHttpRequest"
  };

  const { data } = await axios.post(
    "https://app.ytdown.to/proxy.php",
    params,
    { headers }
  );

  if (!data?.api?.mediaItems) {
    throw new Error("Media tidak ditemukan");
  }

  // ambil mp3 render
  const mp3 = data.api.mediaItems.find(
    v => v.type === "Audio" && v.mediaExtension === "MP3"
  );

  if (!mp3) throw new Error("MP3 tidak tersedia");

  // request render mp3
  const render = await axios.get(mp3.mediaUrl);

  if (render.data.status !== "completed") {
    throw new Error("MP3 belum siap");
  }

  return {
    title: data.api.title,
    thumbnail: data.api.imagePreviewUrl,
    download: render.data.fileUrl
  };
}

module.exports = function (app) {

  app.get("/download/play", async (req, res) => {
    try {

      const { apikey, q } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
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

      const searchResult = await yts(q);

      if (!searchResult?.videos?.length) {
        return res.json({
          status: false,
          error: "Video tidak ditemukan"
        });
      }

      const video = searchResult.videos[0];
      const result = await getYouTubeMp3(video.url);

      res.json({
        status: true,
        creator: "Matstoree",
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
