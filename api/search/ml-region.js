const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");

async function mlregion(userId, zoneId) {
  if (!userId || isNaN(userId)) throw new Error("Invalid user id");
  if (!zoneId || isNaN(zoneId)) throw new Error("Invalid zone id");

  const url = "https://pizzoshop.com/mlchecker/check";

  const data = qs.stringify({
    user_id: userId,
    zone_id: zoneId
  });

  const config = {
    method: "post",
    url: url,
    headers: {
      authority: "pizzoshop.com",
      "content-type": "application/x-www-form-urlencoded",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      origin: "https://pizzoshop.com",
      referer: "https://pizzoshop.com/mlchecker"
    },
    data: data
  };

  try {
    const response = await axios(config);
    const $ = cheerio.load(response.data);

    const table = $(".table-modern");

    if (table.length === 0) {
      const errorMsg = $(".alert-danger").text().trim();
      throw new Error(errorMsg || "Data tidak ditemukan atau User ID salah.");
    }

    const result = {};

    table.find("tr").each((i, el) => {
      const key = $(el).find("th").text().replace(/\s+/g, " ").trim();
      const value = $(el).find("td").text().trim();

      if (key.includes("Nickname")) result.username = value;
      if (key.includes("Region ID")) result.region = value;
      if (key.includes("Last Login")) result.lastLogin = value;
      if (key.includes("Created data")) result.createdAt = value;
    });

    if (!result.username) throw new Error("Data tidak valid atau tidak ditemukan");

    return result;

  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = function (app) {
  app.get("/search/ml-region", async (req, res) => {
    try {
      const { apikey, user_id, zone_id } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!user_id || !zone_id) {
        return res.json({
          status: false,
          error: "user_id dan zone_id wajib diisi"
        });
      }

      const data = await mlregion(user_id, zone_id);

      res.json({
        status: true,
        creator: "Matstoree",
        result: {
          user_id,
          zone_id,
          username: data.username,
          region: data.region,
          last_login: data.lastLogin,
          created_at: data.createdAt,
          raw: data
        }
      });

    } catch (e) {
      res.json({
        status: false,
        error: e.message
      });
    }
  });
};
