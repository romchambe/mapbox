import React, { useCallback, } from 'react';
import mapboxgl from 'mapbox-gl';


export function App() {

const setMap = useCallback(container => {
  new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [5, 32],
    zoom: 2
  })
}, [])



  return (
    <div ref={setMap}>
   
    </div>
  )
}


