const axios = require("axios");
const yts = require("yt-search");
const crypto = require("crypto");

const MASTER_KEY_HEX = "C5D58EF67A7584E4A29F6C35BBC4EB12";

module.exports = function (app) {

  function decryptPayload(encryptedBase64) {
    const dataBuffer = Buffer.from(encryptedBase64, "base64");
    const iv = dataBuffer.slice(0, 16);
    const ciphertext = dataBuffer.slice(16);
    const key = Buffer.from(MASTER_KEY_HEX, "hex");
    const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
    let decrypted = decipher.update(ciphertext, "binary", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  }

  async function getCDN() {
    const res = await axios.get("https://media.savetube.vip/api/random-cdn");
    return res.data.cdn;
  }

  async function getYouTubeMp3(url) {
    const cdn = await getCDN();

    const infoRes = await axios.post(
      `https://${cdn}/v2/info`,
      { url },
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://ytmp4.co.za",
          Referer: "https://ytmp4.co.za/"
        }
      }
    );

    if (!infoRes.data.status) {
      throw new Error(infoRes.data.message || "Failed to fetch info");
    }

    const decrypted = decryptPayload(infoRes.data.data);
    const key = decrypted.key;

    let medias = [];

    if (decrypted.medias) {
      medias = decrypted.medias;
    } else if (decrypted.data && decrypted.data.audio) {
      medias = decrypted.data.audio;
    }

    if (!medias.length) {
      throw new Error("Audio media not found");
    }

    const audio =
      medias.find(v => v.type === "audio" && (v.quality === "128" || v.quality === "128kbps"))
      || medias[0];

    const downloadRes = await axios.post(
      `https://${cdn}/download`,
      {
        downloadType: "audio",
        quality: audio.quality,
        key: key
      },
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://ytmp4.co.za",
          Referer: "https://ytmp4.co.za/"
        }
      }
    );

    if (!downloadRes.data.status) {
      throw new Error(downloadRes.data.message || "Failed to generate link");
    }

    return {
      title: decrypted.title,
      duration: decrypted.duration || 0,
      thumbnail: decrypted.thumbnail,
      download: downloadRes.data.data
    };
  }

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

      if (!searchResult || !searchResult.videos || searchResult.videos.length === 0) {
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
        creator: "ItsMeMatt",
        error: e.message
      });
    }
  });

};
