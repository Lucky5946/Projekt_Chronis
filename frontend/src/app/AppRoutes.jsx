import { useEffect, useState } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import AboutPage from "../pages/AboutPage";
import ContactsPage from "../pages/ContactsPage";
import Login from "../pages/Login";
import SystemMain from "../pages/System_main";
import SystemFirmy from "../pages/System_Firmy";
import SystemFirmyEdit from "../pages/System_Firmy_Edit";
import MojeDochazka from "../pages/MojeDochazka";
import SchvalovaniAbsenci from "../pages/SchvalovaniAbsenci";
import ZadostOAbsenci from "../pages/zadost_o_absenci";
import DochazkoveReporty from "../pages/DochazkoveReporty";
import Exporty from "../pages/Exporty";
import Uzivatele from "../pages/Uzivatele";
import UzivatelEdit from "../pages/UzivatelEdit";
import Nastaveni from "../pages/Nastaveni";
import Napoveda from "../pages/Napoveda";
import Zpravy from "../pages/Zpravy";
import MojeZadosti from "../pages/MojeZadosti";
import HistorieDochazky from "../pages/HistorieDochazky";
import AccessDenied from "../pages/AccessDenied";
import NotFound from "../pages/NotFound";
import NastavitHeslo from "../pages/NastavitHeslo";
import Recenze from "../pages/Recenze";

function AdminRoute({ children }) {
  const [state, setState] = useState({ loading: true, allowed: false, logged: false });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("http://localhost/api/get_user.php", {
          credentials: "include",
        });
        const data = await response.json();

        setState({
          loading: false,
          allowed: Boolean(data.success && data.user?.isAdmin),
          logged: Boolean(data.success),
        });
      } catch {
        setState({ loading: false, allowed: false, logged: false });
      }
    };

    checkUser();
  }, []);

  if (state.loading) {
    return <div className="min-h-screen bg-pozadi" />;
  }

  if (!state.logged) {
    return <Navigate to="/login" replace />;
  }

  if (!state.allowed) {
    return <AccessDenied />;
  }

  return children;
}

function AdminOrManagerRoute({ children }) {
  const [state, setState] = useState({ loading: true, allowed: false, logged: false });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("http://localhost/api/get_user.php", {
          credentials: "include",
        });
        const data = await response.json();

        setState({
          loading: false,
          allowed: Boolean(data.success && (data.user?.isAdmin || data.user?.isManager)),
          logged: Boolean(data.success),
        });
      } catch {
        setState({ loading: false, allowed: false, logged: false });
      }
    };

    checkUser();
  }, []);

  if (state.loading) {
    return <div className="min-h-screen bg-pozadi" />;
  }

  if (!state.logged) {
    return <Navigate to="/login" replace />;
  }

  if (!state.allowed) {
    return <AccessDenied />;
  }

  return children;
}

function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, logged: false });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("http://localhost/api/get_user.php", {
          credentials: "include",
        });
        const data = await response.json();

        setState({ loading: false, logged: Boolean(data.success) });
      } catch {
        setState({ loading: false, logged: false });
      }
    };

    checkUser();
  }, []);

  if (state.loading) {
    return <div className="min-h-screen bg-pozadi" />;
  }

  if (!state.logged) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/o-nas" element={<AboutPage />} />
      <Route path="/kontakty" element={<ContactsPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/nastavit_heslo" element={<NastavitHeslo />} />
      <Route path="/system_main" element={<ProtectedRoute><SystemMain /></ProtectedRoute>} />
      <Route path="/moje_dochazka" element={<ProtectedRoute><MojeDochazka /></ProtectedRoute>} />
      <Route path="/moje_zadosti" element={<ProtectedRoute><MojeZadosti /></ProtectedRoute>} />
      <Route path="/historie_dochazky" element={<ProtectedRoute><HistorieDochazky /></ProtectedRoute>} />
      <Route path="/schvalovani_absenci" element={<AdminOrManagerRoute><SchvalovaniAbsenci /></AdminOrManagerRoute>} />
      <Route path="/dochazkove_reporty" element={<AdminOrManagerRoute><DochazkoveReporty /></AdminOrManagerRoute>} />
      <Route path="/exporty" element={<AdminOrManagerRoute><Exporty /></AdminOrManagerRoute>} />
      <Route path="/uzivatele" element={<AdminOrManagerRoute><Uzivatele /></AdminOrManagerRoute>} />
      <Route path="/uzivatele/:id" element={<AdminOrManagerRoute><UzivatelEdit /></AdminOrManagerRoute>} />
      <Route path="/nastaveni" element={<AdminRoute><Nastaveni /></AdminRoute>} />
      <Route path="/napoveda" element={<ProtectedRoute><Napoveda /></ProtectedRoute>} />
      <Route path="/zpravy" element={<ProtectedRoute><Zpravy /></ProtectedRoute>} />
      <Route path="/recenze" element={<ProtectedRoute><Recenze /></ProtectedRoute>} />
      <Route path="/System_Firmy" element={<AdminRoute><SystemFirmy /></AdminRoute>} />
      <Route path="/System_Firmy_Edit/:id" element={<AdminRoute><SystemFirmyEdit /></AdminRoute>} />
      <Route path="/zadost_o_absenci" element={<ProtectedRoute><ZadostOAbsenci /></ProtectedRoute>} />
      <Route path="/nemate-pristup" element={<AccessDenied />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
