import dayjs from "dayjs/esm"
import utcPlugin from "dayjs/esm/plugin/utc"
import timezonePlugin from "dayjs/esm/plugin/timezone"
import customParseFormat from "dayjs/esm/plugin/customParseFormat"
import duration from "dayjs/esm/plugin/duration"
import isSameOrBefore from "dayjs/esm/plugin/isSameOrBefore"
import weekday from "dayjs/esm/plugin/weekday"

dayjs.extend(utcPlugin)
dayjs.extend(timezonePlugin)
dayjs.extend(customParseFormat)
dayjs.extend(duration)
dayjs.extend(isSameOrBefore)
dayjs.extend(weekday)

/**
 * Takes a time in any timezone (without timezone info) and converts it to UTC time
 */
export function tranformToUTC(date: string, format?: string, timezone: string = "Asia/Shanghai"): number {
  if (!format) return dayjs.tz(date, timezone).valueOf()
  return dayjs.tz(date, format, timezone).valueOf()
}

// On Cloudflare, dayjs() returns 0, so it can't be placed at the top level
function words() {
  return [
    {
      startAt: dayjs(),
      regExp: /^(?:今[天日]|to?day?)(.*)/,
    },
    {
      startAt: dayjs().subtract(1, "days"),
      regExp: /^(?:昨[天日]|y(?:ester)?day?)(.*)/,
    },
    {
      startAt: dayjs().subtract(2, "days"),
      regExp: /^(?:前天|(?:the)?d(?:ay)?b(?:eforeyesterda)?y)(.*)/,
    },
    {
      startAt: dayjs().isSameOrBefore(dayjs().weekday(1)) ? dayjs().weekday(1).subtract(1, "week") : dayjs().weekday(1),
      regExp: /^(?:周|星期)一(.*)/,
    },
    {
      startAt: dayjs().isSameOrBefore(dayjs().weekday(2)) ? dayjs().weekday(2).subtract(1, "week") : dayjs().weekday(2),
      regExp: /^(?:周|星期)二(.*)/,
    },
    {
      startAt: dayjs().isSameOrBefore(dayjs().weekday(3)) ? dayjs().weekday(3).subtract(1, "week") : dayjs().weekday(3),
      regExp: /^(?:周|星期)三(.*)/,
    },
    {
      startAt: dayjs().isSameOrBefore(dayjs().weekday(4)) ? dayjs().weekday(4).subtract(1, "week") : dayjs().weekday(4),
      regExp: /^(?:周|星期)四(.*)/,
    },
    {
      startAt: dayjs().isSameOrBefore(dayjs().weekday(5)) ? dayjs().weekday(5).subtract(1, "week") : dayjs().weekday(5),
      regExp: /^(?:周|星期)五(.*)/,
    },
    {
      startAt: dayjs().isSameOrBefore(dayjs().weekday(6)) ? dayjs().weekday(6).subtract(1, "week") : dayjs().weekday(6),
      regExp: /^(?:周|星期)六(.*)/,
    },
    {
      startAt: dayjs().isSameOrBefore(dayjs().weekday(7)) ? dayjs().weekday(7).subtract(1, "week") : dayjs().weekday(7),
      regExp: /^(?:周|星期)[天日](.*)/,
    },
    {
      startAt: dayjs().add(1, "days"),
      regExp: /^(?:明[天日]|y(?:ester)?day?)(.*)/,
    },
    {
      startAt: dayjs().add(2, "days"),
      regExp: /^(?:[后後][天日]|(?:the)?d(?:ay)?a(?:fter)?t(?:omrrow)?)(.*)/,
    },
  ]
}

const patterns = [
  {
    unit: "years",
    regExp: /(\d+)(?:年|y(?:ea)?rs?)/,
  },
  {
    unit: "months",
    regExp: /(\d+)(?:[个個]?月|months?)/,
  },
  {
    unit: "weeks",
    regExp: /(\d+)(?:周|[个個]?星期|weeks?)/,
  },
  {
    unit: "days",
    regExp: /(\d+)(?:天|日|d(?:ay)?s?)/,
  },
  {
    unit: "hours",
    regExp: /(\d+)(?:[个個]?(?:小?时|[時点點])|h(?:(?:ou)?r)?s?)/,
  },
  {
    unit: "minutes",
    regExp: /(\d+)(?:分[鐘钟]?|m(?:in(?:ute)?)?s?)/,
  },
  {
    unit: "seconds",
    regExp: /(\d+)(?:秒[鐘钟]?|s(?:ec(?:ond)?)?s?)/,
  },
]

const patternSize = Object.keys(patterns).length

/**
 * Preprocess the date string
 * @param {string} date the raw date string
 */
function toDate(date: string) {
  return date
    .toLowerCase()
    .replace(/(^an?\s)|(\san?\s)/g, "1") // replace `a` and `an` with `1`
    .replace(/几|幾/g, "3") // e.g. treat `几秒钟前` (a few seconds ago) as `3秒钟前` (3 seconds ago)
    .replace(/[\s,]/g, "")
} // remove all whitespace

/**
 * Converts `['\d+时', ..., '\d+秒']` into `{ hours: \d+, ..., seconds: \d+ }`
 * Used to describe a length of time
 * @param {Array.<string>} matches all matched results
 */
function toDurations(matches: string[]) {
  const durations: Record<string, string> = {}

  let p = 0
  for (const m of matches) {
    for (; p <= patternSize; p++) {
      const match = patterns[p].regExp.exec(m)
      if (match) {
        durations[patterns[p].unit] = match[1]
        break
      }
    }
  }
  return durations
}

export const parseDate = (date: string | number, ...options: any) => dayjs(date, ...options).toDate()

export function parseRelativeDate(date: string, timezone: string = "UTC") {
  if (date === "刚刚") return new Date()
  // Preprocess the date string `date`

  const theDate = toDate(date)

  // Split `\d+年\d+月...\d+秒前` into `['\d+年', ..., '\d+秒前']`

  const matches = theDate.match(/\D*\d+(?![:\-/]|(a|p)m)\D+/g)
  const offset = dayjs.duration({ hours: (dayjs().tz(timezone).utcOffset() - dayjs().utcOffset()) / 60 })

  if (matches) {
    // Get the last time unit, e.g. `\d+秒前`

    const lastMatch = matches.pop()

    if (lastMatch) {
      // If the last time unit contains markers like `前`, `以前`, `之前` (ago), subtract the corresponding length of time
      // e.g. `1分10秒前` (1 minute 10 seconds ago)

      const beforeMatches = /(.*)(?:前|ago)$/.exec(lastMatch)
      if (beforeMatches) {
        matches.push(beforeMatches[1])
        // The duration plugin has a bug: it reimplements the subtract method and doesn't handle weeks. Using ms lets us call the default method.
        return dayjs().subtract(dayjs.duration(toDurations(matches))).toDate()
      }

      // If the last time unit contains markers like `后`, `以后`, `之后` (later), add the corresponding length of time
      // e.g. `1分10秒后` (1 minute 10 seconds later)

      const afterMatches = /(?:^in(.*)|(.*)[后後])$/.exec(lastMatch)
      if (afterMatches) {
        matches.push(afterMatches[1] ?? afterMatches[2])
        return dayjs()
          .add(dayjs.duration(toDurations(matches)))
          .toDate()
      }

      // Below handles the case where the date string `date` contains a special word
      // e.g. `今天1点10分` (today at 1:10)

      matches.push(lastMatch)
    }
    const firstMatch = matches.shift()

    if (firstMatch) {
      for (const w of words()) {
        const wordMatches = w.regExp.exec(firstMatch)
        if (wordMatches) {
          matches.unshift(wordMatches[1])

          // Use midnight of the day the special word refers to as the start point, then add the corresponding length of time

          return dayjs.tz(w.startAt
            .set("hour", 0)
            .set("minute", 0)
            .set("second", 0)
            .set("millisecond", 0)
            .add(dayjs.duration(toDurations(matches)))
            .add(offset), timezone)
            .toDate()
        }
      }
    }
  } else {
    // If the date string `date` matches none of the patterns, assume the `special word + standard time format` case, and directly replace the special word with the corresponding date
    // e.g. if today is `2022-03-22`, then `今天 20:00` (today 20:00) => `2022-03-22 20:00`

    for (const w of words()) {
      const wordMatches = w.regExp.exec(theDate)
      if (wordMatches) {
        // The default parser of dayjs() can parse '8:00 pm' but not '8:00pm'
        // so we need to insert a space in between
        return dayjs.tz(`${w.startAt.add(offset).format("YYYY-MM-DD")} ${/a|pm$/.test(wordMatches[1]) ? wordMatches[1].replace(/a|pm/, " $&") : wordMatches[1]}`, timezone).toDate()
      }
    }
  }

  return date
}
