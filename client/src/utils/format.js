/** The API returns DATETIME as 'YYYY-MM-DD HH:MM:SS'. Show it as "Nov 12, 2:30 PM". */
export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/** Page / tile colour for an emergency, by priority */
export const PRIORITY_TINT = {
  Critical: '#a3242b',
  High: '#a8500f',
  Medium: '#7d6608',
  Low: '#535353',
}

/** count(1, 'emergency', 'emergencies') -> '1 emergency' */
export const count = (n, one, many) => `${n} ${n === 1 ? one : many}`
