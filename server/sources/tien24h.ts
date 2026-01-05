import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const response = await myFetch("https://www.24h.com.vn/")
  const $ = cheerio.load(response)
  const news: NewsItem[] = []

  $("h3 a, .story-title a").each((_, el) => {
    const $el = $(el)
    const title = $el.text().trim()
    const url = $el.attr("href")

    if (title && url && title.length > 0) {
      news.push({
        id: url,
        title,
        url: url.startsWith("http") ? url : `https://www.24h.com.vn${url}`,
        pubDate: Date.now(),
      })
    }
  })

  return news.slice(0, 20)
})
