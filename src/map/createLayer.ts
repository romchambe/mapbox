import mapboxgl, {
  Map,
  CustomLayerInterface,
  MercatorCoordinate,
  MapboxEvent,
  LngLat,
} from "mapbox-gl"
import {
  AxesHelper,
  BoxGeometry,
  BoxHelper,
  DirectionalLight,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import Protobuf from "pbf"
import { getTile } from "./tiles"
// eslint-disable-next-line @typescript-eslint/no-var-requires
const parser = require("@mapbox/vector-tile")

export const centerLat = 48.85827
export const centerLng = 2.29448

export class Layer implements CustomLayerInterface {
  id: string
  renderingMode: "2d" | "3d"
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  type: "custom" = "custom"
  map: null | Map = null
  camera: null | PerspectiveCamera = null
  scene: null | Scene = null
  renderer: null | WebGLRenderer = null
  ready = false

  constructor(params: { id: string; renderingMode: "2d" | "3d" }) {
    const { id, renderingMode } = params
    this.id = id
    this.renderingMode = renderingMode
  }

  onAdd(map: Map, gl: WebGLRenderingContext): void {
    this.map = map

    this.map.addSource("mapbox.mapbox-streets-v8", {
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8",
    })
    this.camera = new PerspectiveCamera()
    this.scene = new Scene()
    this.renderer = new WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    })
    this.map.on("move", (event: MapboxEvent) => {
      const center: LngLat = event.target.getCenter()
      const zoom = Math.trunc(event.target.getZoom())
      const { x, y } = getTile(center.lat, center.lng, zoom)
      console.log("ZOOM", zoom, x, y, center.lng, center.lat)

      if (zoom > 13.5 && zoom < 15.5) {
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
              console.log("Tile", tile)
            }
          })
          .catch((res) => console.log(res.message))
      }
    })
    this.renderer.autoClear = false
    // create two three.js lights to illuminate the model
    const directionalLight = new DirectionalLight(0xffffff)
    directionalLight.position.set(0, -70, 100).normalize()
    this.scene.add(directionalLight)

    const directionalLight2 = new DirectionalLight(0xffffff)
    directionalLight2.position.set(0, 70, 100).normalize()
    this.scene.add(directionalLight2)

    // use the three.js GLTF loader to add the 3D model to the three.js scene
    const axesHelper = new AxesHelper(100)
    this.scene.add(axesHelper)
  }

  render(gl: WebGLRenderingContext, matrix: Array<number>): void {
    const position = MercatorCoordinate.fromLngLat([centerLng, centerLat])
    const scale = position.meterInMercatorCoordinateUnits()

    const geometry = new BoxGeometry(100, 100, 100)
    const material = new MeshBasicMaterial({ color: 0x00ff00 })
    const cube = new Mesh(geometry, material)

    if (this.scene) this.scene.add(cube)

    const m = new Matrix4().fromArray(matrix)
    const l = new Matrix4()
      .makeTranslation(
        MercatorCoordinate.fromLngLat([centerLng, centerLat]).x,
        MercatorCoordinate.fromLngLat([centerLng, centerLat]).y,
        0
      )
      .scale(new Vector3(scale, scale, scale))

    if (!!this.map && !!this.renderer && !!this.scene && !!this.camera) {
      this.camera.projectionMatrix = m.multiply(l)

      this.renderer.state.reset()
      this.renderer.render(this.scene, this.camera)
      this.map.triggerRepaint()
    }
  }
}
