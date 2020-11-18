import React, { useCallback } from "react"
import mapboxgl from "mapbox-gl"
import "../assets/styles/tailwind.output.css"

export function App(): JSX.Element {
  const setMap = useCallback((container) => {
    new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [5, 32],
      zoom: 2,
    })
  }, [])

  return (
    <div className="p-8 pb-12 h-screen">
      <div className="h-full" ref={setMap} />
    </div>
  )
}
