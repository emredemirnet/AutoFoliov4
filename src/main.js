import React from 'react'
import ReactDOM from 'react-dom/client'
import AutoFolio from './AutoFolio.js'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  React.createElement(React.StrictMode, null,
    React.createElement(AutoFolio, null)
  )
);
