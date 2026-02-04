const axios = require("axios")
const crypto = require("crypto")
const yts = require("yt-search")

const anu = Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex")

function decrypt(enc) {
  const b = Buffer.from(enc.replace(/\s/g, ""), "base64")
  const iv = b.subarray(0, 16)
  const data = b.subarray(16)
  const d = crypto.createDecipheriv("aes-128-cbc", anu, iv)
  return JSON.parse(Buffer.concat([d.update(data), d.final()]).toString())
}

async function savetube(url) {
  const random = await axios.get("https://media.savetube.vip/api/random-cdn", {
    headers: {
      origin: "https://save-tube.com",
      referer: "https://save-tube.com/",
      "User-Agent": "Mozilla/5.0"
    }
  })

  const cdn = random.data.cdn

  const info = await axios.post(
    `https://${cdn}/v2/info`,
    { url },
    {
      headers: {
        "Content-Type": "application/json",
        origin: "https://save-tube.com",
        referer: "https://save-tube.com/",
        "User-Agent": "Mozilla/5.0"
      }
    }
  )

  if (!info.data || !info.data.status) return null

  const json = decrypt(info.data.data)

  async function download(type, quality) {
    const r = await axios.post(
      `https://${cdn}/download`,
      {
        id: json.id,
        key: json.key,
        downloadType: type,
        quality: String(quality)
      },
      {
        headers: {
          "Content-Type": "application/json",
          origin: "https://save-tube.com",
          referer: "https://save-tube.com/",
          "User-Agent": "Mozilla/5.0"
        }
      }
    )
    return r.data?.data?.downloadUrl || null
  }

  const audio = json.audio_formats.sort((a, b) => b.quality - a.quality)[0]
  const audioUrl = await download("audio", audio.quality)

  return {
    title: json.title,
    duration: json.duration,
    thumbnail: json.thumbnail,
    audio: audioUrl
  }
}

module.exports = function (app) {
  app.get("/download/play", async (req, res) => {
    try {
      const { apikey, q } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" })
      }

      if (!q) {
        return res.json({ status: false, error: "Query tidak boleh kosong" })
      }

      const search = await yts(q)
      if (!search.videos || !search.videos.length) {
        return res.json({ status: false, error: "Video tidak ditemukan" })
      }

      const video = search.videos[0]
      const result = await savetube(video.url)

      if (!result || !result.audio) {
        return res.json({ status: false, error: "Gagal mengambil audio" })
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
      })
    } catch (e) {
      res.json({ status: false, error: e.message })
    }
  })
}
