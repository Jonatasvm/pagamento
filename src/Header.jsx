import { LogOut } from "lucide-react";

export default function Header() {
  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "/";
  }

  return (
    <header className="w-full bg-white shadow flex justify-end p-4 px-5 lg:px-10">
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-600 hover:text-red-700 transition font-semibold cursor-pointer"
      >
        <LogOut size={18} />
        Sair
      </button>
    </header>
  );
}
