/* eslint-disable */

declare module 'glob:./sources/{*.ts,**/index.ts}' {
  export const dantri: typeof import('./sources/dantri')
  export const genk: typeof import('./sources/genk')
  export const github: typeof import('./sources/github')
  export const hackernews: typeof import('./sources/hackernews')
  export const thanhnien: typeof import('./sources/thanhnien')
  export const tien24h: typeof import('./sources/tien24h')
  export const tuoitre: typeof import('./sources/tuoitre')
  export const vnexpress: typeof import('./sources/vnexpress')
}
