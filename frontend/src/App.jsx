import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import System_main from "./pages/System_main";
import System_Firmy from "./pages/System_Firmy";
import System_Firmy_Edit from "./pages/System_Firmy_Edit";
import Zadost_o_absenci from "./pages/zadost_o_absenci";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/system_main" element={<System_main />} />
        <Route path="/System_Firmy" element={<System_Firmy />} />
        <Route path="/System_Firmy_Edit/:id" element={<System_Firmy_Edit />} />
        <Route path="/zadost_o_absenci" element={<Zadost_o_absenci />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

