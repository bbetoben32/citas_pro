import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InicioUsuario } from "./principal/inicio_usuario.jsx";
import { InicioPro } from "./principal/inicio_pro.jsx";
import {InicioSesion} from "./login/inicio_sesion.jsx"
import Inicio from "./inicio/inicio.jsx";
import "./styles/index.css";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
       
        <Route path="/principal_usu" element={<InicioUsuario />} />
        <Route path="/principal_pro" element={<InicioPro />} />
        <Route path="/inicio" element={<InicioSesion />} />
      </Routes>
    </BrowserRouter>
  );
}



export default App;