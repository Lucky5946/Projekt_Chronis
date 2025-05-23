import logo from "../assets/manufactory-lab.png";

function Header() {
  return (
    <header className="bg-pozadi text-black py-4">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div>
          <img src={logo} alt="Logo" className="h-10" />
        </div>
        <div className="flex items-center space-x-6">
          <nav>
            <ul className="flex space-x-4 text-lg font-extrabold text-black">
              <li>
                <a
                  href="#about"
                  className="inline-block transition-transform duration-300 ease-in-out hover:scale-110"
                >
                  O nás
                </a>
              </li>

              <li>
                <a
                  href="#contact"
                  className="inline-block text-black transition-transform duration-300 ease-in-out hover:scale-110"
                >
                  Kontakty
                </a>
              </li>
            </ul>
          </nav>
          <a
            href="/login"
            className="bg-primary px-8 py-2 rounded-3xl text-white text-xl font-black cursor-pointer transition hover:scale-105"
          >
            Přihlásit se
          </a>
        </div>
      </div>
    </header>
  );
}

export default Header;
