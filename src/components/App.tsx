import React, { useCallback, useEffect, useState } from "react"
import mapboxgl, { MapboxEvent } from "mapbox-gl"
import "../assets/styles/tailwind.output.css"
import { centerLat, centerLng, Layer } from "../map/createLayer"

export function App(): JSX.Element {
  const [mapEl, setMapEl] = useState<null | mapboxgl.Map>(null)

  const setMap = useCallback(
    (container) => {
      if (container && !mapEl) {
        const map = new mapboxgl.Map({
          container,
          style: "mapbox://styles/mapbox/streets-v11",
          zoom: 14,
          center: [centerLng, centerLat],
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
      }
    }
  }, [mapEl])

  return (
    <div className="p-8 pb-12 h-screen">
      <div className="h-full" ref={setMap} />
    </div>
  )
}

// function moveListener(ev: MapboxEvent): void {
//   console.log(
//     "EVENT",
//     ev.target.getCenter().lat,
//     ev.target.getCenter().lng
//   )
// }

function addLayer(ev: MapboxEvent): void {
  console.log("Styles", ev)
  const map = ev.target
  if (!map.getLayer("custom_buildings")) {
    map.addLayer(
      new Layer({ id: "custom_buildings", renderingMode: "3d" })
    )
  }
}
