const latest = defineRSSSource("https://vnexpress.net/rss/tin-moi-nhat.rss")
const tech = defineRSSSource("https://vnexpress.net/rss/so-hoa.rss")

export default defineSource({
  "vnexpress": latest,
  "vnexpress-latest": latest,
  "vnexpress-tech": tech,
})
