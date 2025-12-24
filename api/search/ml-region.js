const axios = require("axios");

async function mlregion(user_id, zone_id) {
  if (!user_id || isNaN(user_id)) throw new Error("Invalid user id");
  if (!zone_id || isNaN(zone_id)) throw new Error("Invalid zone id");

  const { data } = await axios.post(
    "https://api.nekolabs.web.id/px?url=https://api-gw-prd.vocagame.com/gateway-ms/order/v1/client/transactions/verify",
    {
      shop_code: "MOBILE_LEGENDS",
      data: {
        user_id: user_id.toString(),
        zone_id: zone_id.toString()
      }
    },
    {
      headers: {
        origin: "https://vocagame.com",
        referer: "https://vocagame.com/",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36",
        "x-api-key": "4QG09jBHxuS4",
        "x-client": "web-mobile",
        "x-country": "ID",
        "x-locale": "id-id",
        "x-timestamp": Date.now()
      }
    }
  );

  if (!data?.result?.content) throw new Error("Data tidak ditemukan");

  return data.result.content;
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
          country: data.country_of_origin?.toUpperCase(),
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