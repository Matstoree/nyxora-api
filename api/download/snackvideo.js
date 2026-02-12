const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function snack(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const video = $("div.video-box").find("a-video-player");
    const author = $("div.author-info");
    const attr = $("div.action");

    return {
      title: $(author)
        .find("div.author-desc > span")
        .children("span")
        .eq(0)
        .text()
        .trim(),
      thumbnail: $(video)
        .parent()
        .siblings("div.background-mask")
        .children("img")
        .attr("src"),
      media: $(video).attr("src"),
      author: $("div.author-name").text().trim(),
      authorImage: $(attr).find("div.avatar > img").attr("src"),
      like: $(attr).find("div.common").eq(0).text().trim(),
      comment: $(attr).find("div.common").eq(1).text().trim(),
      share: $(attr).find("div.common").eq(2).text().trim()
    };

  } catch (error) {
    throw error;
  }
}

module.exports = function (app) {
  app.get('/download/snackvideo', async (req, res) => {
    try {
      const { apikey, url } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: 'Apikey invalid'
        });
      }

      if (!url) {
        return res.json({
          status: false,
          error: 'Url is required'
        });
      }

      const results = await snack(url);

      res.status(200).json({
        status: true,
        result: results
      });

    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  });
};
