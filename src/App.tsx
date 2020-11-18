import React, { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';


export function App() {
const [lng, setLng] = useState(5) 
const [lat, setLat] = useState(34) 
const [zoom, setZoom] = useState(2) 
const setMap = useCallback(container => {
  new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [lng, lat],
    zoom: zoom
  })
}, [])



  return (
    <div ref={setMap}>
   
    </div>
  )
}


