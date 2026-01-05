import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const response = await myFetch("https://vnexpress.net/")
  const $ = cheerio.load(response)
  const news: NewsItem[] = []

  $("h3.title-news a, h2.title-news a").each((_, el) => {
    const $el = $(el)
    const title = $el.text().trim()
    const url = $el.attr("href")

    if (title && url) {
      news.push({
        id: url,
        title,
        url: url.startsWith("http") ? url : `https://vnexpress.net${url}`,
        pubDate: Date.now(),
      })
    }
  })

  return news.slice(0, 20)
})
