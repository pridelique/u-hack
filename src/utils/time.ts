export const todayISO = () => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

export const toMinutes = (dateTime: string) => {
  const date = new Date(dateTime)
  return date.getHours() * 60 + date.getMinutes()
}

export const formatTime = (dateTime: string) => new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(dateTime))

export const addMinutes = (dateTime: string, minutes: number) => new Date(
  new Date(dateTime).getTime() + minutes * 60_000,
).toISOString()

export const combineDateTime = (date: string, time: string) => new Date(`${date}T${time}:00+07:00`).toISOString()

export const formatDuration = (seconds: number) => `${Math.max(1, Math.round(seconds / 60))} min`
export const formatDistance = (meters: number) => `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`
