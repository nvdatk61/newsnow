/* eslint-disable */

declare module 'glob:./sources/{*.ts,**/index.ts}' {
  export const github: typeof import('./sources/github')
  export const hackernews: typeof import('./sources/hackernews')
  export const steam: typeof import('./sources/steam')
  export const tien24h: typeof import('./sources/tien24h')
  export const vnexpress: typeof import('./sources/vnexpress')
}
