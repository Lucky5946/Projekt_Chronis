import Aside from "../components/aside";

export default function SystemLayout({ children, className = "" }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Aside />
      <main
        className={`flex-1 bg-gradient-to-b from-pozadi via-pozadi to-white overflow-y-auto ${className}`}
      >
        {children}
      </main>
    </div>
  );
}
