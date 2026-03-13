const axios = require("axios");
const yts = require("yt-search");
const crypto = require("crypto");

const MASTER_KEY_HEX = "C5D58EF67A7584E4A29F6C35BBC4EB12";

/* decrypt response savetube */
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

/* module savetube */
const savetube = {

  async getCDN() {
    const res = await axios.get("https://media.savetube.vip/api/random-cdn");
    return res.data.cdn;
  },

  async getInfo(url) {
    const cdn = await this.getCDN();

    const res = await axios.post(
      `https://${cdn}/v2/info`,
      { url },
      {
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://ytmp4.co.za",
          "Referer": "https://ytmp4.co.za/"
        }
      }
    );

    if (!res.data.status) {
      throw new Error(res.data.message || "Failed to fetch info");
    }

    const decrypted = decryptPayload(res.data.data);

    return {
      cdn,
      ...decrypted
    };
  },

  async getDownload(cdn, key, quality = "mp3", type = "audio") {

    const res = await axios.post(
      `https://${cdn}/download`,
      {
        downloadType: type,
        quality: quality,
        key: key
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://ytmp4.co.za",
          "Referer": "https://ytmp4.co.za/"
        }
      }
    );

    if (!res.data.status) {
      throw new Error(res.data.message || "Failed to generate link");
    }

    return res.data.data;
  }

};

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

      if (!searchResult.videos.length) {
        return res.json({
          status: false,
          error: "Video tidak ditemukan"
        });
      }

      const video = searchResult.videos[0];

      /* ambil info dari savetube */
      const info = await savetube.getInfo(video.url);

      /* ambil audio mp3 */
      const audio = await savetube.getDownload(
        info.cdn,
        info.key,
        "mp3",
        "audio"
      );

      res.json({
        status: true,
        creator: "Matstoree",
        metadata: {
          title: video.title,
          channel: video.author.name,
          duration: video.seconds,
          cover: video.thumbnail,
          url: video.url
        },
        audio: audio.downloadUrl
      });

    } catch (e) {

      res.json({
        status: false,
        error: e.message
      });

    }

  });

};
