import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {App} from './components/App';
import reportWebVitals from './reportWebVitals';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = "pk.eyJ1Ijoicm9tY2hhbWJlIiwiYSI6ImNraG42MnNmODA5Ymoyd2s4bGtocnR6MWcifQ.BUHBlSsIxk8pGk12tnqSUQ"

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
