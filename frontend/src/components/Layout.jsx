import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navItems = [
    {
        label: "Dashboard",
        path: "/dashboard",
    },
    {
        label: "Applications",
        path: "/applications",
    },
    {
        label: "Analytics",
        path: "/analytics",
    },
    {
        label: "Resumes",
        path: "/resumes",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col">
        <div className="border-b border-slate-800 px-6 py-5">
          <h1 className="text-xl font-bold">
            Job Tracker
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Stay organized. Get hired.
          </p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <p className="truncate px-2 text-sm text-slate-400">
            {user?.email}
          </p>

          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="lg:hidden">
              <h1 className="font-bold">
                Job Tracker
              </h1>
            </div>

            <div className="ml-auto text-sm text-slate-400">
              {user?.email}
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

export default Layout;