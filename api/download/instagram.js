const axios = require('axios')
const vm = require('node:vm')
const cheerio = require('cheerio')

async function getTurnstileToken() {
  const sitekeyRes = await axios.get('https://api.neoxr.eu/api/get-sitekey', {
    params: {
      url: 'https://snapinsta.to',
      apikey: 'NyxoraApikey'
    }
  })
  if (!sitekeyRes.data || !sitekeyRes.data.status) throw new Error('Failed to get sitekey')
  const sitekey = sitekeyRes.data.data.sitekey
  const tokenRes = await axios.get('https://api.neoxr.eu/api/bypass-turnstile', {
    params: {
      url: 'https://snapinsta.to',
      sitekey,
      apikey: 'NyxoraApikey'
    }
  })
  if (!tokenRes.data || !tokenRes.data.status) throw new Error('Failed to bypass turnstile')
  return tokenRes.data.data.token
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
  const { data } = await axios.post('https://snapinsta.to/api/ajaxSearch', body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: 'https://snapinsta.to/en2',
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
    }
  })
  const html = runVM(data.data)
  const $ = cheerio.load(html)
  const downloads = $('a.abutton.is-success')
    .map((_, el) => $(el).attr('href'))
    .get()
  if (!downloads.length) throw new Error('Media not found')
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
