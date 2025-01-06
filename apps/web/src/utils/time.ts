export function toThDate(date: string) {
  return new Date(date).toLocaleDateString('th-TH', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
}

export function getHMS(ms: number) {
  const s = ~~(ms / 1000)
  const m = ~~(s / 60)
  const h = ~~(m / 60)
  return [h, m % 60, s % 60]
}

export function toTimerFormat(ms: number) {
  const twoDigit = (x: number) => (x < 10 ? '0' + x : x)
  return getHMS(ms).map(twoDigit).join(' : ')
}

export function toThaiDuration(ms: number) {
  const [h, m, s] = getHMS(ms)
  return [h && `${h} ชั่วโมง`, m && `${m} นาที`, s && `${s} วินาที`]
    .filter((str) => str)
    .join(' ')
}

export const getRemaining = (start: string, end: string) =>
  new Date(end).getTime() - new Date(start).getTime()

export const ONE_SECOND = 1000
export const ONE_MINUTE = 60 * ONE_SECOND
export const ONE_HOUR = 60 * ONE_MINUTE
export const ONE_DAY = 24 * ONE_HOUR
export const ONE_WEEK = 7 * ONE_DAY
// approximately
export const ONE_MONTH = 30 * ONE_DAY
export const ONE_YEAR = 365 * ONE_DAY
