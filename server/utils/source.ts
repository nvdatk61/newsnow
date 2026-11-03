import process from "node:process"
import type { AllSourceID, NewsItem } from "@shared/types"
import defu from "defu"
import type { RSSHubOption, RSSHubInfo as RSSHubResponse, SourceGetter, SourceOption } from "#/types"

type R = Partial<Record<AllSourceID, SourceGetter>>
export function defineSource(source: SourceGetter): SourceGetter
export function defineSource(source: R): R
export function defineSource(source: SourceGetter | R): SourceGetter | R {
  return source
}

export function defineRSSSource(url: string, option?: SourceOption): SourceGetter {
  return async () => {
    const data = await rss2json(url)
    if (!data?.items.length) throw new Error("Cannot fetch rss data")
    const seen = new Set<string>()
    const news: NewsItem[] = []
    for (const item of data.items) {
      const link = typeof item.link === "string" ? item.link.trim() : ""
      const title = item.title == null ? "" : String(item.title).trim()
      // Skip malformed entries and duplicates (same article listed twice)
      if (!link || !title || seen.has(link)) continue
      seen.add(link)
      news.push({
        title,
        url: link,
        id: link,
        pubDate: !option?.hiddenDate ? item.created : undefined,
      })
    }
    return news
  }
}

export function defineRSSHubSource(route: string, RSSHubOptions?: RSSHubOption, sourceOption?: SourceOption): SourceGetter {
  return async () => {
    // "https://rsshub.pseudoyu.com"
    const RSSHubBase = "https://rsshub.rssforever.com"
    const url = new URL(route, RSSHubBase)
    url.searchParams.set("format", "json")
    RSSHubOptions = defu<RSSHubOption, RSSHubOption[]>(RSSHubOptions, {
      sorted: true,
    })

    Object.entries(RSSHubOptions).forEach(([key, value]) => {
      url.searchParams.set(key, value.toString())
    })
    const data: RSSHubResponse = await myFetch(url)
    return data.items.map(item => ({
      title: item.title,
      url: item.url,
      id: item.id ?? item.url,
      pubDate: !sourceOption?.hiddenDate ? item.date_published : undefined,
    }))
  }
}

export function proxySource(proxyUrl: string, source: SourceGetter) {
  return process.env.CF_PAGES
    ? defineSource(async () => {
        const data = await myFetch(proxyUrl)
        return data.items
      })
    : source
}
