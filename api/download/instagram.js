const { chromium } = require("playwright");

async function igdl(url) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://fastdl.app/id", { waitUntil: "networkidle" });
  await page.fill("#search-form-input", url);
  await page.click("#searchFormButton");
  await page.waitForSelector("a.button.button__download");

  const download = await page.$$eval(
    "a.button.button__download",
    els => els.map(el => el.href)
  );

  await browser.close();
  return download;
}

module.exports = function (app) {
  app.get("/download/instagram", async (req, res) => {
    try {
      const { apikey, url } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!url) {
        return res.json({
          status: false,
          error: "Url Instagram tidak boleh kosong"
        });
      }

      const result = await igdl(url);

      if (!result || result.length === 0) {
        return res.json({
          status: false,
          error: "Media tidak ditemukan"
        });
      }

      res.json({
        status: true,
        creator: "Matstoree",
        result
      });
    } catch (err) {
      res.json({
        status: false,
        error: err.message
      });
    }
  });
};
