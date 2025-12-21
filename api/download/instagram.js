const { chromium } = require('playwright')

async function igdl(url) {
  if (!/instagram\.com/i.test(url)) {
    throw new Error("Invalid Instagram URL")
  }

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto("https://fastdl.app/id", { waitUntil: "networkidle" })
  await page.fill("#search-form-input", url)
  await page.click("#searchFormButton")

  await page.waitForSelector("a.button.button__download", { timeout: 30000 })

  const downloadUrls = await page.$$eval(
    "a.button.button__download",
    els => els.map(el => el.href)
  )

  let thumbnail = ""
  try {
    thumbnail = await page.$eval("img", el => el.src)
  } catch {}

  await browser.close()

  const first = downloadUrls[0] || ""
  let title = "Instagram Media"
  if (first.includes("filename=")) {
    const params = new URLSearchParams(first.split("?")[1])
    title = params.get("filename")?.replace(/\.mp4$/i, "") || title
  }

  return {
    title,
    thumbnail,
    downloadUrls
  }
}

module.exports = function (app) {
  app.get('/download/instagram', async (req, res) => {
    const { apikey, url } = req.query

    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' })
    }

    if (!url) {
      return res.json({ status: false, error: 'Url is required' })
    }

    try {
      const result = await igdl(url)
      res.status(200).json({
        status: true,
        result
      })
    } catch (e) {
      res.status(500).json({
        status: false,
        error: e.message
      })
    }
  })
}
