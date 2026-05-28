import { Link } from "react-router-dom";
import logo from "../assets/manufactory-lab.png";

function Header() {
  return (
    <header className="bg-pozadi text-black py-4">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" aria-label="Prejit na hlavni stranku">
          <img src={logo} alt="Logo" className="h-10" />
        </Link>

        <div className="flex items-center space-x-6">
          <nav>
            <ul className="flex space-x-4 text-lg font-extrabold text-black">
              <li>
                <Link
                  to="/o-nas"
                  className="inline-block transition-transform duration-300 ease-in-out hover:scale-110"
                >
                  O nás
                </Link>
              </li>

              <li>
                <Link
                  to="/kontakty"
                  className="inline-block text-black transition-transform duration-300 ease-in-out hover:scale-110"
                >
                  Kontakty
                </Link>
              </li>
            </ul>
          </nav>

          <Link
            to="/login"
            className="bg-primary px-8 py-2 rounded-3xl text-white text-xl font-black cursor-pointer transition hover:scale-105"
          >
            Přihlásit se
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
