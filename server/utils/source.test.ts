import { beforeEach, describe, expect, it, vi } from "vitest"
import { myFetch } from "./fetch"
import { defineRSSSource } from "./source"

vi.mock("./fetch", () => ({ myFetch: vi.fn() }))

// Synthetic feed, not real publisher content
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Example</title>
  <item>
    <title><![CDATA[ Tiêu đề thứ nhất ]]></title>
    <link>https://example.com/a.html</link>
    <pubDate>Tue, 03 Nov 2026 10:00:00 +0700</pubDate>
  </item>
  <item>
    <title>Tiêu đề trùng</title>
    <link>https://example.com/a.html</link>
    <pubDate>Tue, 03 Nov 2026 09:00:00 +0700</pubDate>
  </item>
  <item>
    <title></title>
    <link>https://example.com/no-title.html</link>
  </item>
  <item>
    <title>Không có link</title>
  </item>
  <item>
    <title>Tiêu đề thứ hai &amp; ký tự</title>
    <link>https://example.com/b.html</link>
    <pubDate>Tue, 03 Nov 2026 08:00:00 +0700</pubDate>
  </item>
</channel></rss>`

describe("defineRSSSource", () => {
  beforeEach(() => {
    vi.mocked(myFetch).mockReset()
  })

  it("maps items, trims titles, drops duplicates and malformed entries", async () => {
    vi.mocked(myFetch).mockResolvedValue(feed as any)
    const items = await defineRSSSource("https://example.com/rss")()
    expect(items).toEqual([
      { id: "https://example.com/a.html", url: "https://example.com/a.html", title: "Tiêu đề thứ nhất", pubDate: "Tue, 03 Nov 2026 10:00:00 +0700" },
      { id: "https://example.com/b.html", url: "https://example.com/b.html", title: "Tiêu đề thứ hai & ký tự", pubDate: "Tue, 03 Nov 2026 08:00:00 +0700" },
    ])
  })

  it("omits pubDate when hiddenDate is set", async () => {
    vi.mocked(myFetch).mockResolvedValue(feed as any)
    const items = await defineRSSSource("https://example.com/rss", { hiddenDate: true })()
    expect(items.every(i => i.pubDate === undefined)).toBe(true)
  })

  it("throws a clear error when the site returns HTML instead of a feed", async () => {
    vi.mocked(myFetch).mockResolvedValue(`<!DOCTYPE html><html><body>Access denied</body></html>` as any)
    await expect(defineRSSSource("https://example.com/rss")()).rejects.toThrow("https://example.com/rss did not return an RSS/Atom feed")
  })

  it("throws on an empty feed so the cached data is served instead", async () => {
    vi.mocked(myFetch).mockResolvedValue(`<rss><channel><title>x</title></channel></rss>` as any)
    await expect(defineRSSSource("https://example.com/rss")()).rejects.toThrow("Cannot fetch rss data")
  })
})
