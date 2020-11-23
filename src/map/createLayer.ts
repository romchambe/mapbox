import {
  Map,
  CustomLayerInterface,
  MercatorCoordinate,
  MapboxEvent,
  Point,
} from "mapbox-gl"

import {
  CylinderGeometry,
  DirectionalLight,
  Intersection,
  Matrix4,
  Mesh,
  MeshPhongMaterial,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
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
  map: null | any = null
  camera: null | PerspectiveCamera = null
  scene: null | Scene = null
  renderer: null | WebGLRenderer = null
  ready = false
  state: { buildings: DrawableFeature[]; tilesLoaded: string[] }
  loadTiles: (event: MapboxEvent) => void
  raycaster = new Raycaster()
  origin: MercatorCoordinate
  scale: number
  cameraTransform: Matrix4

  constructor(params: { id: string; renderingMode: "2d" | "3d" }) {
    const { id, renderingMode } = params
    this.id = id
    this.renderingMode = renderingMode
    this.state = { buildings: [], tilesLoaded: [] }
    this.loadTiles = loadTiles.bind(this)

    this.origin = MercatorCoordinate.fromLngLat([originLng, originLat], 0)
    this.scale = this.origin.meterInMercatorCoordinateUnits()

    const { x, y, z } = this.origin

    const scale = new Matrix4().makeScale(
      this.scale,
      this.scale,
      -this.scale
    )

    this.cameraTransform = new Matrix4()
      .multiply(scale)
      .setPosition(x, y, z)

    this.raycaster.near = -1
    this.raycaster.far = 1e6
  }

  onAdd(map: Map, gl: WebGLRenderingContext): void {
    this.map = map
    this.camera = new PerspectiveCamera(
      28,
      this.map.transform.width / this.map.transform.height,
      1,
      1e6
    )
    this.scene = new Scene()
    this.renderer = new WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    })

    console.log(this.map.transform, this.cameraTransform)
    this.renderer.autoClear = false
    this.map.on("move", this.loadTiles)

    // create two three.js lights to illuminate the model
    const directionalLight = new DirectionalLight(0xffffff)
    directionalLight.position.set(0, -70, 100).normalize()
    this.scene.add(directionalLight)

    const directionalLight2 = new DirectionalLight(0xffffff)
    directionalLight2.position.set(0, 70, 100).normalize()
    this.scene.add(directionalLight2)
  }

  raycast(point: Point): void {
    if (this.camera && this.scene && this.map) {
      const mouse = new Vector2()
      // scale mouse pixel position to a percentage of the screen's width and height
      mouse.x = (point.x / this.map.transform.width) * 2 - 1
      mouse.y = 1 - (point.y / this.map.transform.height) * 2

      const camInverseProjection = new Matrix4().getInverse(
        this.camera.projectionMatrix
      )
      const cameraPosition = new Vector3().applyMatrix4(
        camInverseProjection
      )
      const mousePosition = new Vector3(mouse.x, mouse.y, 1).applyMatrix4(
        camInverseProjection
      )

      const viewDirection = mousePosition
        .clone()
        .sub(cameraPosition)
        .normalize()

      this.raycaster.set(cameraPosition, viewDirection)

      // calculate objects intersecting the picking ray
      const intersects = this.raycaster.intersectObjects(
        this.scene.children,
        true
      )
      intersects.forEach((intersection: Intersection) => {
        const material = (intersection.object as Mesh)
          .material as MeshPhongMaterial

        material.color.setHex(0x00aa00)
        material.emissive.setHex(0x008800)
        material.specular.setHex(0x00cc00)

        animate(intersection.object)
      })
      if (intersects.length > 0) {
        console.log("MOUSE", intersects[0])
      }
    }
  }

  render(gl: WebGLRenderingContext, matrix: Array<number>): void {
    if (!!this.map && !!this.renderer && !!this.scene && !!this.camera) {
      // console.log(this.map.transform.mercatorMatrix, matrix)
      this.camera.projectionMatrix = new Matrix4()
        .fromArray(matrix)
        .multiply(this.cameraTransform)

      this.renderer.state.reset()
      this.renderer.render(this.scene, this.camera)
      this.map.triggerRepaint()
    }
  }
}

function animate(cylinder: Object3D) {
  const intervals = 30
  const height = 20
  const changePerInterval = height / intervals

  while (cylinder.scale.y < height) {
    cylinder.scale.y += changePerInterval
  }

  requestAnimationFrame((time) => {
    console.log("ANIM ", time)
    animate(cylinder)
  })
}
