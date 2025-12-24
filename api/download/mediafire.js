const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {
  app.get("/download/mediafire", async (req, res) => {
    try {
      const { apikey, url } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!url || !/mediafire\.com/.test(url)) {
        return res.json({
          status: false,
          error: "Url MediaFire tidak valid"
        });
      }

      const page = await axios.get(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
        }
      });

      const $ = cheerio.load(page.data);
      const dl = $(".input.popsok").attr("href");

      if (!dl || !/download\d+\.mediafire\.com/.test(dl)) {
        return res.json({
          status: false,
          error: "Link download tidak ditemukan"
        });
      }

      const cont = {
        af: "Africa",
        an: "Antarctica",
        as: "Asia",
        eu: "Europe",
        na: "North America",
        oc: "Oceania",
        sa: "South America"
      };

      const name = $(".intro .filename").text().trim();
      const size = $(".details li:nth-child(1) span").text().trim();
      const date = $(".details li:nth-child(2) span").text().trim();
      const type = $(".intro .filetype").text().trim();

      const $lo = $(".DLExtraInfo-uploadLocation");

      const continentCode = $lo
        .find(".DLExtraInfo-uploadLocationRegion")
        .attr("data-lazyclass")
        ?.replace("continent-", "");

      const location = $lo
        .find(".DLExtraInfo-sectionDetails p")
        .text()
        .match(/from (.*?) on/)?.[1];

      const flag = $lo
        .find(".flag")
        .attr("data-lazyclass")
        ?.replace("flag-", "");

      res.json({
        status: true,
        creator: "Matstoree",
        metadata: {
          name,
          size,
          type,
          date,
          continent: cont[continentCode] || "Unknown",
          location,
          flag
        },
        download: dl
      });
    } catch (e) {
      res.json({
        status: false,
        error: e.message
      });
    }
  });
};