import { Link, NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { getInitials } from "../lib/design-system";
import { ThemeToggle } from "./mindcheck-ui";
import { useAuth } from "../store/auth";

export const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const initials = getInitials(user?.name);
  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/checkin", label: "Check-in" },
    { to: "/insights", label: "Insights" },
    { to: "/journal", label: "Journal" },
    { to: "/breathe", label: "Relief" },
    { to: "/settings", label: "Profile" }
  ];

  return (
    <div className="app-shell">
      <header className="shell-header">
        <div className="shell-header__inner">
          <Link to="/" className="brand-mark">MindCheck</Link>
          <nav className="nav-strip" aria-label="Primary">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            {user ? (
              <>
                <Link
                  to="/settings"
                  aria-label="Open profile"
                  title="Open profile"
                  className="button-secondary"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-base)]">
                    {initials}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-xs text-muted">Profile</span>
                    <span className="block text-sm font-semibold">{user.name}</span>
                  </span>
                </Link>
                <button type="button" onClick={logout} className="button-primary">Log out</button>
              </>
            ) : (
              <Link to="/login" className="button-primary">Log in</Link>
            )}
          </div>
        </div>
      </header>
      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
};
