// ================= CONFIGURATION =================
const HOSTS = [
  "love.kehiceg834.workers.dev",
  "love.iz0j8e57e0.workers.dev",
  "love.ratif55218.workers.dev",
  "love.dedihid298.workers.dev",
  "love.buwexa.workers.dev",
  "love.juhul7q8ei.workers.dev",
  "love.sikoyo3159.workers.dev",
  "love.djovidyq96.workers.dev",
];

const ORIGINS = ["lx-origin", "vx-origin"];
const RESOLUTIONS = ["720", "480"];

const STREAM_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer": "https://embed.bananacreamcafe.com/",
  "Origin": "https://embed.bananacreamcafe.com",
};

// =================================================

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

function toBase64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16))
  }))
}

function fromBase64(str) {
  try {
    return decodeURIComponent(atob(str).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
  } catch (e) {
    return str
  }
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function handleRequest(request) {
  const url = new URL(request.url)
  const workerBase = `${url.protocol}//${url.host}`

  // 1. CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    })
  }

  // 2. PROXY ENGINE
  if (url.pathname.startsWith('/proxy')) {
    const rawTargetUrl = url.searchParams.get('url')
    if (!rawTargetUrl) return new Response('Missing URL', { status: 400 })

    let targetUrl = fromBase64(decodeURIComponent(rawTargetUrl))
    if (!targetUrl.startsWith('http')) {
      targetUrl = decodeURIComponent(rawTargetUrl)
    }

    try {
      const response = await fetch(targetUrl, { headers: STREAM_HEADERS })

      if (targetUrl.toLowerCase().includes('.m3u8')) {
        let body = await response.text()
        const tObj = new URL(targetUrl)
        const baseUrl = `${tObj.protocol}//${tObj.host}${tObj.pathname.substring(0, tObj.pathname.lastIndexOf('/'))}`

        const rewritten = body.split('\n').map(line => {
          const segment = line.trim()
          if (!segment) return ""

          if (segment.startsWith('#')) {
            return segment.replace(/URI="([^"]+)"/g, (match, uri) => {
              const absUri = uri.startsWith('http') ? uri : `${baseUrl}/${uri.replace(/^\//, '')}`
              const b64Uri = encodeURIComponent(toBase64(absUri))
              return `URI="${workerBase}/proxy?url=${b64Uri}"`
            })
          }

          const finalVideoUrl = segment.startsWith('http') ? segment : `${baseUrl}/${segment.replace(/^\//, '')}`
          const b64Video = encodeURIComponent(toBase64(finalVideoUrl))
          return `${workerBase}/proxy?url=${b64Video}`
        }).join('\n')

        return new Response(rewritten, {
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        })
      }

      const resHeaders = new Headers(response.headers)
      resHeaders.set('Access-Control-Allow-Origin', '*')
      return new Response(response.body, { status: response.status, headers: resHeaders })

    } catch (e) {
      return new Response(e.toString(), { status: 500 })
    }
  }

  // 3. MAIN PLAYLIST (ล็อกชื่อไฟล์ตามที่เรียกเข้ามา ไม่แตกลูปย่อยเพิ่ม)
  const pathMatch = url.pathname.match(/^\/([^\/]+)\/(?:chunks|playlist)\.m3u8$/i)

  if (pathMatch) {
    const channelId = pathMatch[1]

    // ดึงชื่อไฟล์จริงที่เรียกเข้ามา (เช่น chunks.m3u8 หรือ playlist.m3u8) เอาไปใช้ค้นหาตรงๆ
    const requestFileName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1)

    let finalUrl = null;
    const shuffledHosts = shuffleArray(HOSTS);

    // ลูปค้นหาเท่าเดิม (Host -> Origin -> Resolution) เท่ากับสคริปต์ PHP เดิมเป๊ะ
    outerLoop:
    for (const host of shuffledHosts) {
      for (const origin of ORIGINS) {
        for (const resolution of RESOLUTIONS) {
          const testUrl = `https://${host}/${origin}/${channelId}_${resolution}/${requestFileName}`;

          try {
            const checkRes = await fetch(testUrl, { method: 'HEAD', headers: STREAM_HEADERS });
            if (checkRes.status === 200) {
              finalUrl = testUrl;
              break outerLoop;
            }
          } catch (err) {
            continue;
          }
        }
      }
    }

    if (finalUrl) {
      try {
        const response = await fetch(finalUrl, { headers: STREAM_HEADERS });
        if (!response.ok) return new Response('❌ Stream Origin Connection Error', { status: 500 });

        let body = await response.text();
        const cfObj = new URL(finalUrl)
        const baseUrl = `${cfObj.protocol}//${cfObj.host}${cfObj.pathname.substring(0, cfObj.pathname.lastIndexOf('/'))}`

        const rewritten = body.split('\n').map(line => {
          const segment = line.trim()
          if (!segment) return ""

          if (segment.startsWith('#')) {
            return segment.replace(/URI="([^"]+)"/g, (match, uri) => {
              const absUri = uri.startsWith('http') ? uri : `${baseUrl}/${uri.replace(/^\//, '')}`
              const b64Uri = encodeURIComponent(toBase64(absUri))
              return `URI="${workerBase}/proxy?url=${b64Uri}"`
            })
          }

          const finalVideoUrl = segment.startsWith('http') ? segment : `${baseUrl}/${segment.replace(/^\//, '')}`
          const b64Video = encodeURIComponent(toBase64(finalVideoUrl))
          return `${workerBase}/proxy?url=${b64Video}`
        }).join('\n')

        return new Response(rewritten, {
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        })
      } catch (e) {
        return new Response('Worker Parsing Error: ' + e.message, { status: 500 })
      }
    }

    return new Response('❌ NO ONLINE SOURCE FOUND FROM WORKER POOL', { status: 404 })
  }

  return new Response('❌ Invalid URL format', { status: 400 })
}
