// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fortawesome/fontawesome-free/css/all.min.css';

import App from './App'; // Importa el componente principal (App.js)

// Asegúrate de que este sea el contenedor raíz
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderiza tu aplicación aquí
root.render(<App />);
