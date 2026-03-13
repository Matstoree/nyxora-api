const axios = require("axios")
const crypto = require("crypto")

const MASTER_KEY_HEX = "C5D58EF67A7584E4A29F6C35BBC4EB12"

/* decrypt response savetube */
function decryptPayload(encryptedBase64) {
  const dataBuffer = Buffer.from(encryptedBase64, "base64")
  const iv = dataBuffer.slice(0, 16)
  const ciphertext = dataBuffer.slice(16)
  const key = Buffer.from(MASTER_KEY_HEX, "hex")

  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv)

  let decrypted = decipher.update(ciphertext, "binary", "utf8")
  decrypted += decipher.final("utf8")

  return JSON.parse(decrypted)
}

/* module savetube */
const savetube = {

  async getCDN() {
    const res = await axios.get("https://media.savetube.vip/api/random-cdn")
    return res.data.cdn
  },

  async getInfo(url) {

    const cdn = await this.getCDN()

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
    )

    if (!res.data.status) {
      throw new Error(res.data.message || "Failed to fetch info")
    }

    const decrypted = decryptPayload(res.data.data)

    return {
      cdn,
      ...decrypted
    }

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
    )

    if (!res.data.status) {
      throw new Error(res.data.message || "Failed to generate link")
    }

    return res.data.data
  }

}

module.exports = function (app) {

  async function getYouTubeMp3(url) {

    const info = await savetube.getInfo(url)

    const audio = await savetube.getDownload(
      info.cdn,
      info.key,
      "mp3",
      "audio"
    )

    const videoId =
      url.split("be/")[1]?.split("?")[0] ||
      url.split("v=")[1]?.split("&")[0]

    return {
      title: info.title,
      duration: info.duration || 0,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      download: audio.downloadUrl
    }

  }

  app.get("/download/ytmp3", async (req, res) => {

    try {

      const { apikey, url } = req.query

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        })
      }

      if (!url) {
        return res.json({
          status: false,
          error: "Url is required"
        })
      }

      const result = await getYouTubeMp3(url)

      res.json({
        status: true,
        creator: "ItsMeMatt",
        result
      })

    } catch (e) {

      res.json({
        status: false,
        error: e.message
      })

    }

  })

}
