const CACHE_NAME = "osm-tiles-v1"
const RUNTIME_CACHE = "runtime-osm-tiles"

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll([
        "/", // shell (best-effort)
      ])
    })(),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.map((k) => (k !== CACHE_NAME && k !== RUNTIME_CACHE ? caches.delete(k) : Promise.resolve())),
      )
    })(),
  )
  self.clients.claim()
})

self.addEventListener("message", (event) => {
  if (!event.data) return
  if (event.data.type === "CACHE_TILES" && Array.isArray(event.data.tiles)) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE)
        await Promise.all(
          event.data.tiles.map(async (url) => {
            try {
              const res = await fetch(url, { mode: "no-cors" })
              await cache.put(url, res.clone())
            } catch (e) {
              // ignore failures
            }
          }),
        )
      })(),
    )
  }
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)
  // Cache OSM tiles with cache-first
  if (url.hostname.includes("tile.openstreetmap.org")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE)
        const cached = await cache.match(request.url)
        if (cached) return cached
        try {
          const res = await fetch(request)
          cache.put(request.url, res.clone())
          return res
        } catch (e) {
          // offline fallback: try a nearby zoom tile or return a generic response
          const fallback = await caches.match(request.url)
          if (fallback) return fallback
          return new Response("", { status: 504 })
        }
      })(),
    )
  }
})
