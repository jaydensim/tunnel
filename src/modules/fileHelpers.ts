export function humanFileSize (size: number) {
  const i = (size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024)))
  return +(size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i]
}

export function mapNumber (x: number, in_min: number, in_max: number, out_min: number, out_max: number) {
  return ((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min) as number
}

export function mapProgress (x: number, max: number) {
  return mapNumber(x, 0, max, 0, 100)
}
