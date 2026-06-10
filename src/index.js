export default {
  async fetch(request) {

    const url = new URL(request.url)
    const pathname = url.pathname

    if (
      pathname.startsWith('/lx-thekop') ||
      pathname.startsWith('/vx-thekop')
    ) {

      let newPathname =
        pathname.replace('-thekop', '-origin')

      // =========================
      // Upstream List
      // =========================
      const upstreams = [
        "love.xw9scj95pb.workers.dev",
        "love.6on8kvivjo.workers.dev",
        "love.6on8kvivjo.workers.dev",
        "love.dsilxfnrms.workers.dev",
        "love.peqicy.workers.dev",
      ]

      // random upstream
      const upstream =
        upstreams[Math.floor(Math.random() * upstreams.length)]

      const targetUrl =
        `https://${upstream}${newPathname}${url.search}`

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',

          'Referer':
            'https://embed.bananacreamcafe.com/',

          'Origin':
            'https://embed.bananacreamcafe.com'
        }
      })

      const headers = new Headers(response.headers)

      headers.set('Access-Control-Allow-Origin', '*')

      return new Response(response.body, {
        status: response.status,
        headers
      })
    }

    return new Response('Not Found', {
      status: 404
    })
  }
}
