export const PROJECT_PAGE_SIZE = 6

export function parseProjectPage(raw: string | string[] | undefined): number | null {
  if (raw === undefined) return 1
  if (typeof raw !== 'string' || !/^[1-9]\d{0,5}$/.test(raw)) return null
  return Number(raw)
}

export function projectPageRange(page: number, total: number) {
  return { first: total ? (page - 1) * PROJECT_PAGE_SIZE + 1 : 0, last: Math.min(page * PROJECT_PAGE_SIZE, total) }
}
