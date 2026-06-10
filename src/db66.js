addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const workerBase = `${url.protocol}//${url.host}`

  const PHP_BACKEND = "http://webp.ddns.me/db66/DB66_P.php"

  // ==========================================
  // 1. CORS Preflight
  // ==========================================
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    })
  }

  // ==========================================
  // 2. PROXY ENGINE (ดักรับ URL ตรงพาสルーไปหาไฟล์สตรีมและวิดีโอ)
  // ==========================================
  if (url.pathname.startsWith('/proxy')) {
    const targetUrl = url.searchParams.get('url')
    if (!targetUrl) return new Response('Missing URL', { status: 400 })

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://embed.bananacreamcafe.com/",
          "Origin": "https://embed.bananacreamcafe.com"
        }
      })

      // หากปลายทางเป็นไฟล์ดัชนีย่อย .m3u8 ให้จัดโครงสร้างภายในใหม่
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
              return `URI="${workerBase}/proxy?url=${encodeURIComponent(absUri)}"`
            })
          }

          const finalVideoUrl = segment.startsWith('http') ? segment : `${baseUrl}/${segment.replace(/^\//, '')}`
          return `${workerBase}/proxy?url=${encodeURIComponent(finalVideoUrl)}`
        }).join('\n')

        return new Response(rewritten, {
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        })
      }

      // หากเป็นไฟล์วิดีโอ (.ts) ให้ปล่อยไหลความเร็วสูงสุดผ่านโครงข่าย CDN
      const resHeaders = new Headers(response.headers)
      resHeaders.set('Access-Control-Allow-Origin', '*')

      return new Response(response.body, {
        status: response.status,
        headers: resHeaders
      })
    } catch (e) {
      return new Response(e.toString(), { status: 500 })
    }
  }

  // ==========================================
  // 3. MAIN PLAYLIST (สอยพิกัดจากช่องสัญญาณหลังบ้าน)
  // ==========================================
  const pathMatch = url.pathname.match(/^\/([^\/]+)\/(?:chunks|playlist|index)\.m3u8$/i);

  if (pathMatch) {
    const channelId = pathMatch[1]

    try {
      // ดักจับ Header โลเคชันจากตัวจัดการของเซิร์ฟเวอร์หลัก
      const response = await fetch(`${PHP_BACKEND}?channel=${channelId}`, { redirect: 'manual' })
      const location = response.headers.get('location')

      if (location) {
        // ดึงพิกัดลิงก์ตรงจากพารามิเตอร์ url= หรือค่า Location โดยตรงแบบไม่เข้ารหัส
        const urlMatch = location.match(/[?&]url=([^&]+)/)
        const cloudfrontUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : location

        // ดึงข้อมูลเพลย์ลิสต์ตั้งต้นตรงจากท่อ Workers
        const directRes = await fetch(cloudfrontUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://embed-x.eatmorebanana.org/",
            "Origin": "https://embed-x.eatmorebanana.org"
          }
        })

        if (!directRes.ok) return new Response('❌ Stream Origin connection error', { status: 500 })
        let body = await directRes.text()

        const cfObj = new URL(cloudfrontUrl)
        const baseUrl = `${cfObj.protocol}//${cfObj.host}${cfObj.pathname.substring(0, cfObj.pathname.lastIndexOf('/'))}`

        const lines = body.split('\n')
        const rewritten = lines.map(line => {
          const segment = line.trim()
          if (!segment) return ""

          if (segment.startsWith('#')) {
            return segment.replace(/URI="([^"]+)"/g, (match, uri) => {
              const absUri = uri.startsWith('http') ? uri : `${baseUrl}/${uri.replace(/^\//, '')}`
              return `URI="${workerBase}/proxy?url=${encodeURIComponent(absUri)}"`
            })
          }

          const finalVideoUrl = segment.startsWith('http') ? segment : `${baseUrl}/${segment.replace(/^\//, '')}`
          return `${workerBase}/proxy?url=${encodeURIComponent(finalVideoUrl)}`
        })

        return new Response(rewritten.join('\n'), {
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        })
      }

      return new Response('❌ Location mapping header not found from backend', { status: 404 })

    } catch (e) {
      return new Response('Worker Error: ' + e.message, { status: 500 })
    }
  }

  return new Response('❌ Invalid URL format. Use: /{channel-name}/chunks.m3u8', { status: 400 })
}
