const axios = require('axios')

async function dramaboxSearch(q) {
  const r = await axios.get(
    `https://www.dramabox.com/search?searchValue=${encodeURIComponent(q)}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
      }
    }
  )

  const match = r.data.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  )
  if (!match) throw new Error('Data not found')

  const json = JSON.parse(match[1])
  const list = json.props?.pageProps?.bookList || []

  return {
    query: q,
    total: list.length,
    results: list.map(v => ({
      id: v.bookId,
      title: v.bookName,
      episodes: v.totalChapterNum,
      description: v.introduction,
      cover: v.coverCutWap || v.coverWap,
      play_url: `https://www.dramabox.com/video/${v.bookId}_${v.bookNameEn}/${v.chapterId}_Episode-1`
    }))
  }
}

module.exports = function (app) {
  app.get('/search/dramabox', async (req, res) => {
    try {
      const { apikey, q } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!q) {
        return res.json({ status: false, error: 'Query is required' })
      }

      const result = await dramaboxSearch(q)

      res.json({
        status: true,
        creator: 'ItsMeMatt',
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
