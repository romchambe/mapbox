import React, { useCallback, useEffect, useState } from "react"
import mapboxgl, { MapboxEvent } from "mapbox-gl"
import "../assets/styles/tailwind.output.css"
import { originLat, originLng, Layer } from "../map/createLayer"

export function App(): JSX.Element {
  const [mapEl, setMapEl] = useState<null | mapboxgl.Map>(null)

  const setMap = useCallback(
    (container) => {
      if (container && !mapEl) {
        const map = new mapboxgl.Map({
          container,
          style: "mapbox://styles/mapbox/streets-v11",
          zoom: 14,
          center: [originLng, originLat],
          pitch: 30,
          antialias: true,
        })

        setMapEl(map)
      }
    },
    [mapEl]
  )

  useEffect(() => {
    if (mapEl) {
      mapEl.on("load", addLayer)

      return () => {
        mapEl.off("load", addLayer)
        mapEl.off("move", layer.loadTiles)
      }
    }
  }, [mapEl])

  return (
    <div className="p-8 pb-12 h-screen">
      <div className="h-full" ref={setMap} />
    </div>
  )
}

const layer = new Layer({ id: "custom_buildings", renderingMode: "3d" })

function addLayer(ev: MapboxEvent): void {
  console.log("Styles", ev)
  const map = ev.target
  if (!map.getLayer("custom_buildings")) {
    map.addLayer(layer)
  }
}
