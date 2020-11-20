import {
  Map,
  CustomLayerInterface,
  MercatorCoordinate,
  MapboxEvent,
} from "mapbox-gl"
import { GeoJSON } from "geojson"
import {
  AxesHelper,
  BoxGeometry,
  DirectionalLight,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three"
import { loadTiles } from "./tiles"

export const originLat = 48.85827
export const originLng = 2.29448

type DrawableFeature = { drawn: boolean } & GeoJSON.Feature
export class Layer implements CustomLayerInterface {
  id: string
  renderingMode: "2d" | "3d"
  type: "custom" = "custom"
  map: null | Map = null
  camera: null | PerspectiveCamera = null
  scene: null | Scene = null
  renderer: null | WebGLRenderer = null
  ready = false
  state: { buildings: DrawableFeature[]; tilesLoaded: string[] }
  loadTiles: (event: MapboxEvent) => void

  constructor(params: { id: string; renderingMode: "2d" | "3d" }) {
    const { id, renderingMode } = params
    this.id = id
    this.renderingMode = renderingMode
    this.state = { buildings: [], tilesLoaded: [] }
    this.loadTiles = loadTiles.bind(this)
  }

  onAdd(map: Map, gl: WebGLRenderingContext): void {
    this.map = map
    this.camera = new PerspectiveCamera()
    this.scene = new Scene()
    this.renderer = new WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    })
    this.renderer.autoClear = false
    this.map.on("move", this.loadTiles)

    // create two three.js lights to illuminate the model
    const directionalLight = new DirectionalLight(0xffffff)
    directionalLight.position.set(0, -70, 100).normalize()
    this.scene.add(directionalLight)

    const directionalLight2 = new DirectionalLight(0xffffff)
    directionalLight2.position.set(0, 70, 100).normalize()
    this.scene.add(directionalLight2)

    const axesHelper = new AxesHelper(1000)
    this.scene.add(axesHelper)
  }

  render(gl: WebGLRenderingContext, matrix: Array<number>): void {
    const origin = MercatorCoordinate.fromLngLat([originLng, originLat])
    const scale = origin.meterInMercatorCoordinateUnits()

    this.state.buildings.forEach((feature, index) => {
      if (
        feature &&
        feature.properties &&
        feature.properties.type === "building" &&
        !feature.drawn
      ) {
        let lnglat: null | [number, number]
        switch (feature.geometry.type) {
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

        const pos: MercatorCoordinate = MercatorCoordinate.fromLngLat(
          lnglat
        )

        const mercatorOffset = {
          x: (pos.x - origin.x) / scale,
          y: (pos.y - origin.y) / scale,
        }

        console.log("offset in meters", mercatorOffset)
        const geometry = new BoxGeometry(20, 20, 20)
        const material = new MeshBasicMaterial({ color: 0x666666 })
        const cube = new Mesh(geometry, material)
        cube.position.set(mercatorOffset.x, mercatorOffset.y, 0)

        if (this.scene) this.scene.add(cube)
        this.state.buildings[index].drawn = true
      }
    })
    const geometry = new BoxGeometry(20, 20, 20)
    const material = new MeshBasicMaterial({ color: 0x666666 })
    const cube = new Mesh(geometry, material)
    if (this.scene) this.scene.add(cube)

    const m = new Matrix4().fromArray(matrix)
    const l = new Matrix4()
      .makeTranslation(origin.x, origin.y, 0)
      .scale(new Vector3(scale, scale, scale))

    if (!!this.map && !!this.renderer && !!this.scene && !!this.camera) {
      this.camera.projectionMatrix = m.multiply(l)

      this.renderer.state.reset()
      this.renderer.render(this.scene, this.camera)
      this.map.triggerRepaint()
    }
  }
}
