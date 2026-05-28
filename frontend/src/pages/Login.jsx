import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import loginImage from "../assets/login.svg";
import logo from "../assets/manufactory-lab.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-regular-svg-icons";
import { faLock } from "@fortawesome/free-solid-svg-icons";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost/api/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ prihlasovaci_jmeno: username, heslo: password }),
      });

      const data = await res.json();

      if (data.success) {
        navigate("/system_main");
      } else {
        setError(data.message || "Neznámá chyba");
      }
    } catch (error) {
      console.error("Chyba přihlášení:", error);
      setError("Chyba s připojením na server");
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-2/5 flex flex-col bg-white px-8 py-6">
        <Link to="/" className="mb-10 w-max" aria-label="Zpět na hlavní stránku">
          <img src={logo} alt="Logo" className="h-12" />
        </Link>

        <div className="mt-16 flex-grow flex items-start flex-col">
          <p className="text-lg mb-2 italic font-semibold">Začněte svoji cestu</p>
          <h2 className="text-5xl font-black mb-6">Manufactory Docházka</h2>
          {error && <p className="text-red-600 font-bold">{error}</p>}

          <form onSubmit={handleSubmit} className="w-full space-y-8 mt-15">
            <div className="relative w-full">
              <label className="absolute -top-3 left-3 bg-white px-1 text-sm font-medium text-black">
                Přihlašovací jméno
              </label>
              <input
                type="text"
                placeholder="Zadejte přihlašovací jméno"
                className="w-full pl-4 pr-12 py-5 border-2 border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <FontAwesomeIcon
                icon={faCircleUser}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-4xl text-black"
              />
            </div>

            <div className="relative w-full">
              <label className="absolute -top-3 left-3 bg-white px-1 text-sm font-medium text-black">
                Heslo
              </label>
              <input
                type="password"
                placeholder="Zadejte heslo"
                className="w-full pl-4 pr-12 py-5 border-2 border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FontAwesomeIcon
                icon={faLock}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-4xl text-black"
              />
            </div>

            <div className="flex items-center mb-6">
              <input
                id="remember"
                type="checkbox"
                className="w-6 h-6 text-primary border-4 border-black rounded focus:ring-2 focus:ring-primary"
              />
              <label
                htmlFor="remember"
                className="ml-3 text-black font-medium select-none text-xl"
              >
                Uložit přihlašovací údaje
              </label>
            </div>

            <button
              type="submit"
              className="w-full text-white py-5 text-4xl rounded-full font-black bg-gradient-to-r from-tlacitko_svetle to-tlacitko_tmave transition-all duration-300 hover:scale-105"
            >
              Přihlásit se
            </button>
          </form>
        </div>
      </div>

      <div className="w-3/5 flex items-end justify-end">
        <img
          src={loginImage}
          alt="Přihlášení"
          className="max-w-max max-h-full object-contain"
        />
      </div>
    </div>
  );
}

export default Login;
