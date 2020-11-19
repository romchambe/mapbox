//Javascript implementation of a script found at https://help.openstreetmap.org/questions/747/given-a-latlon-how-do-i-find-the-precise-position-on-the-tile

//input object includes lat, lon, and zoom level.

export function getTile(
  lat: number,
  lng: number,
  zoom: number
): { x: number; y: number } {
  const MinLatitude = -85.05112878,
    MaxLatitude = 85.05112878,
    MinLongitude = -180,
    MaxLongitude = 180

  const latitude = clip(lat, MinLatitude, MaxLatitude)
  const longitude = clip(lng, MinLongitude, MaxLongitude)

  const x = Math.pow(2, zoom) * ((longitude + 180) / 360)
  const y =
    Math.pow(2, zoom - 1) *
    (1 -
      Math.log(
        Math.tan((latitude * Math.PI) / 180) +
          1 / Math.cos((latitude * Math.PI) / 180)
      ) /
        Math.PI)

  return { x, y }

  function clip(input: number, minValue: number, maxValue: number) {
    return Math.min(Math.max(input, minValue), maxValue)
  }
}
