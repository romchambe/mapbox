//Javascript implementation of a script found at https://help.openstreetmap.org/questions/747/given-a-latlon-how-do-i-find-the-precise-position-on-the-tile

import mapboxgl, {
  LngLat,
  MapboxEvent,
  MercatorCoordinate,
} from "mapbox-gl"
import Protobuf from "pbf"
import { CylinderGeometry, MeshPhongMaterial, Mesh } from "three"
import { Layer } from "./createLayer"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const parser = require("@mapbox/vector-tile")
//input object includes lat, lon, and zoom level.

export function getTileCoords(
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

  const x = Math.trunc(Math.pow(2, zoom) * ((longitude + 180) / 360))
  const y = Math.trunc(
    Math.pow(2, zoom - 1) *
      (1 -
        Math.log(
          Math.tan((latitude * Math.PI) / 180) +
            1 / Math.cos((latitude * Math.PI) / 180)
        ) /
          Math.PI)
  )

  return { x, y }

  function clip(input: number, minValue: number, maxValue: number) {
    return Math.min(Math.max(input, minValue), maxValue)
  }
}

export function loadTiles(this: Layer, event: MapboxEvent): void {
  const center: LngLat = event.target.getCenter()
  const zoom = Math.trunc(event.target.getZoom())
  const { x, y } = getTileCoords(center.lat, center.lng, zoom)

  console.log("ZOOM", x, y, zoom, this.map)

  if (zoom >= 13 && zoom < 16) {
    if (!this.state.tilesLoaded.includes(`${x}-${y}-${zoom}`)) {
      this.state.tilesLoaded.push(`${x}-${y}-${zoom}`)
      fetch(
        `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/${Math.floor(
          zoom
        )}/${Math.floor(x)}/${Math.floor(y)}.mvt?access_token=${
          mapboxgl.accessToken
        }`
      )
        .then(async (res) => {
          if (res.ok) {
            const data = await res.arrayBuffer()
            const tile = new parser.VectorTile(new Protobuf(data))

            this.state.buildings = this.state.buildings.concat(
              new Array(tile.layers.building.length)
                .fill(null)
                .map((el, index) => {
                  return tile.layers.building
                    .feature(index)
                    .toGeoJSON(x, y, zoom)
                })
            )

            drawBuilings.apply(this)

            console.log(
              "Tile buildings",
              new Array(tile.layers.building.length)
                .fill(null)
                .map((el, index) => {
                  return tile.layers.building
                    .feature(index)
                    .toGeoJSON(x, y, zoom)
                })
            )
          }
        })
        .catch((res) => {
          console.log(res.message)
          if (this.state.tilesLoaded.includes(`${x}-${y}-${zoom}`)) {
            this.state.tilesLoaded.filter(
              (tile) => tile !== `${x}-${y}-${zoom}`
            )
          }
        })
    }
  }
}

function drawBuilings(this: Layer) {
  this.state.buildings.forEach((feature, index) => {
    if (
      feature &&
      feature.properties &&
      feature.properties.type === "building" &&
      !feature.drawn
    ) {
      let lnglat: null | [number, number]

      switch (feature.geometry.type) {
        // get only polygons and multipolygons coords
        case "Polygon":
          lnglat = [
            feature.geometry.coordinates[0][0][0],
            feature.geometry.coordinates[0][0][1],
          ]
          break
        case "MultiPolygon":
          lnglat = [
            feature.geometry.coordinates[0][0][0][0],
            feature.geometry.coordinates[0][0][0][1],
          ]
          break
        default:
          lnglat = null
      }

      if (!lnglat) return

      const pos: MercatorCoordinate = MercatorCoordinate.fromLngLat(lnglat)

      // compute the offset from origin in meters
      const mercatorOffset = {
        x: (pos.x - this.origin.x) / this.scale,
        y: (pos.y - this.origin.y) / this.scale,
      }

      // draw a cylinder on buildings positions
      const geometry = new CylinderGeometry(10, 10, 3, 32)
      const material = new MeshPhongMaterial({
        color: 0xaaaaaa,
        specular: "#cccccc",
        emissive: "#888888",
      })
      const obj = new Mesh(geometry, material)
      obj.position.set(mercatorOffset.x, mercatorOffset.y, 0)
      obj.rotation.set(0, Math.PI / 2, Math.PI / 2)
      if (this.scene) this.scene.add(obj)
      this.state.buildings[index].drawn = true
    }
  })
}
