const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.174 Mobile Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  Referer: 'https://spotdown.org/'
};

async function spotdownSearchAndDownload(query) {
  const res = await fetch(
    `https://spotdown.org/api/song-details?url=${encodeURIComponent(query)}`,
    { headers }
  );

  const json = await res.json();

  if (!json.songs || !json.songs.length) {
    throw new Error('Lagu tidak ditemukan');
  }

  const song = json.songs[0];

  return {
    title: song.title,
    artist: song.artist,
    duration: song.duration,
    thumbnail: song.thumbnail,
    spotify_url: song.url,
    download: `https://spotdown.org/api/check-direct-download?url=${encodeURIComponent(song.url)}`
  };
}

module.exports = function (app) {
  app.get('/search/spotify', async (req, res) => {
    try {
      const { apikey, q } = req.query;

      if (!apikey) return res.json({ status: false, error: 'Apikey required' });
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: 'Apikey invalid' });

      if (!q) return res.json({ status: false, error: 'Query is required' });

      const result = await spotdownSearchAndDownload(q);

      res.status(200).json({
        status: true,
        result
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  });
};
