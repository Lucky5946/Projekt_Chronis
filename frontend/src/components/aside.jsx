import React, { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { FaHome, FaUserCog, FaSignOutAlt, FaQuestion, FaEnvelope, FaBuilding, FaProcedures } from "react-icons/fa"; // Přidal jsem 3 ikony pro příklad
import logo from "../assets/manufactory-lab.png";
import profile from "../assets/worker.jpg";
import chronisLogo from "../assets/chronis.png"; // nahraď cestu ke svému logu
import { useNavigate } from "react-router-dom";

function Aside() {
  const [user, setUser] = useState(null);
    const navigate = useNavigate();
useEffect(() => {
  axios
    .get("http://localhost/api/get_user.php", { withCredentials: true })
    .then((res) => {
      if (res.data.success) {
        setUser(res.data.user); // Uložíme do state
      } else {
        console.warn("Uživatel není přihlášen nebo nebyl nalezen.");
      }
    })
    .catch((err) => {
      console.error("Chyba při získávání uživatele:", err);
    });
}, []);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost/api/logout.php", {}, { withCredentials: true });
      // Po úspěšném logoutu přesměrujeme na login
      navigate("/login");
    } catch (error) {
      console.error("Chyba při odhlašování:", error);
    }
  };

  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-pozadi to-primary shadow-lg flex flex-col p-6 text-white">
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <img src={logo} alt="Logo" className="h-10 mb-6" />

        <div className="relative h-auto w-full overflow-hidden">
          <img
            src={profile}
            alt="Profil"
            className="h-full w-full object-cover rounded-tl-full rounded-br-full"
          />
        </div>
{user && (
  <h2 className="mt-4 text-center text-2xl font-black">
    {user.jmeno} {user.prijmeni}
  </h2>
)}

        {/* Tlačítka pod profilem */}
        <div className="flex justify-between w-full mt-6 space-x-3">
                      <button
            className="flex items-center justify-center flex-1 h-10 rounded-lg bg-gradient-to-r from-system_modra_tmavsi to-system_modra_svtetlejsi "
            aria-label="Zprávy"
          >
            <FaEnvelope />
          </button>
    <button
      onClick={handleLogout}
      className="flex items-center justify-center flex-1 h-10 rounded-lg bg-gradient-to-r from-system_cervena_tmavsi to-system_cervena_svetlejsi"
      aria-label="Odhlásit se"
    >
      <FaSignOutAlt />
    </button>
          <button
            className="flex items-center justify-center flex-1 h-10 rounded-lg bg-gradient-to-r from-system_modra_tmavsi to-system_modra_svtetlejsi"
            aria-label="Nastavení"
          >
            <FaQuestion />
          </button>

        </div>
      </div>

      <nav className="flex flex-col space-y-4 mt-6">
        <NavLink
          to="/system_main"
          className={({ isActive }) =>
            `flex items-center space-x-3 text-lg font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition ${
              isActive ? "bg-white/20" : ""
            }`
          }
        >
          <FaHome />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
  to="/zadost_o_absenci"
  className={({ isActive }) =>
    `flex items-center space-x-3 text-lg font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition ${
      isActive ? "bg-white/20" : ""
    }`
  }
>
  <FaProcedures />
  <span>Žádost o absenci</span>
</NavLink>

{user && user.isAdmin && (
        <NavLink
          to="/users"
          className={({ isActive }) =>
            `flex items-center space-x-3 text-lg font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition ${
              isActive ? "bg-white/20" : ""
            }`
          }
        >
          <FaUserCog />
          <span>Uživatelé</span>
        </NavLink>
)}
{user && user.isAdmin && (
  <NavLink
    to="/system_firmy"
    className={({ isActive }) =>
      `flex items-center space-x-3 text-lg font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition ${
        isActive ? "bg-white/20" : ""
      }`
    }
  >
    <FaBuilding />
    <span>Firmy</span>
  </NavLink>
)}

      </nav>
            <div className="mt-auto flex items-center space-x-3 pt-6 border-t border-white/20">
        <img src={chronisLogo} alt="Chronis Logo" className="h-10 w-auto" />
        <span className="text-white font-bold text-3xl">CHRONIS</span>
      </div>
    </aside>
  );
}

export default Aside;
