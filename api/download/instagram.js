const axios = require('axios')
const vm = require('node:vm')
const cheerio = require('cheerio')

async function getTurnstileToken() {
  const { data } = await axios.get(
    'https://api.neoxr.eu/api/bypass-turnstile',
    {
      params: {
        url: 'https://snapinsta.to',
        sitekey: '0x4AAAAAAA4IDAOil0Jqxtin',
        apikey: 'NyxoraApikey'
      }
    }
  )

  if (!data.status || !data.data?.token) {
    throw new Error('Gagal bypass Turnstile')
  }

  return data.data.token
}

function runVM(js) {
  const sandbox = {
    window: {
      location: {
        hostname: 'snapinsta.to',
        href: 'https://snapinsta.to/en2',
        origin: 'https://snapinsta.to'
      }
    },
    document: {
      _el: { innerHTML: '' },
      getElementById(id) {
        if (id === 'search-result') return this._el
        return null
      }
    },
    navigator: {
      userAgent:
        'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
    },
    atob,
    decodeURIComponent
  }

  vm.createContext(sandbox)
  vm.runInContext(js, sandbox)
  return sandbox.document._el.innerHTML
}

async function snapinsta(url) {
  const token = await getTurnstileToken()

  const body = new URLSearchParams({
    q: url,
    t: 'media',
    v: 'v2',
    lang: 'en',
    cftoken: token
  }).toString()

  const { data } = await axios.post(
    'https://snapinsta.to/api/ajaxSearch',
    body,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: 'https://snapinsta.to/en2',
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
      }
    }
  )

  const html = runVM(data.data)
  const $ = cheerio.load(html)

  const downloads = $('a.abutton.is-success')
    .map((_, el) => $(el).attr('href'))
    .get()

  if (!downloads.length) throw new Error('Media tidak ditemukan')

  return downloads
}

module.exports = function (app) {
  app.get('/download/instagram', async (req, res) => {
    try {
      const { apikey, url } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!url) {
        return res.json({ status: false, error: 'Url is required' })
      }

      const result = await snapinsta(url)

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
