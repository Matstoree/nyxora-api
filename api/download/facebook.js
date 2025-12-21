const axios = require('axios')
const cheerio = require('cheerio')

async function facebook(url) {
  if (!/facebook\.\w+\/(reel|watch|share)/gi.test(url)) {
    throw new Error("Invalid Facebook URL")
  }

  const home = await axios.get("https://fdownloader.net/id", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0 Win64 x64)"
    }
  })

  const htmlHome = home.data
  const ex = htmlHome.match(/k_exp\s*=\s*"(\d+)"/i)?.[1]
  const token = htmlHome.match(/k_token\s*=\s*"([a-f0-9]+)"/i)?.[1]

  if (!ex || !token) {
    throw new Error("Failed to extract token")
  }

  const params = new URLSearchParams({
    k_exp: ex,
    k_token: token,
    q: url,
    lang: "id",
    web: "fdownloader.net",
    v: "v2",
    w: ""
  })

  const search = await axios.post(
    "https://v3.fdownloader.net/api/ajaxSearch?lang=id",
    params.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://fdownloader.net",
        Referer: "https://fdownloader.net/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0 Win64 x64)"
      }
    }
  )

  if (search.data.status !== "ok") {
    throw new Error("Scraper failed")
  }

  const $ = cheerio.load(search.data.data)
  const video = []

  $('.download-link-fb').each((i, el) => {
    const link = $(el).attr('href')
    const quality = $(el).attr('title')
    if (link) video.push({ quality, url: link })
  })

  return {
    title: $("h3").first().text().trim() || "",
    duration: $("p").first().text().trim() || "",
    thumbnail: $("img").first().attr("src") || "",
    media: video[0]?.url || "",
    video,
    music: ""
  }
}

module.exports = function (app) {
  app.get('/download/facebook', async (req, res) => {
    const { apikey, url } = req.query
    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' })
    }
    if (!url) {
      return res.json({ status: false, error: 'Url is required' })
    }
    try {
      const result = await facebook(url)
      res.status(200).json({ status: true, result })
    } catch (e) {
      res.status(500).json({ status: false, error: e.message })
    }
  })
}
