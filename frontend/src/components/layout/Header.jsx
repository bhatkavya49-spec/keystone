import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { findNavItem } from "../../navigation/navConfig";
import Icon from "../Icon";

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItem = findNavItem(location.pathname);
  const title = navItem?.label || "Dashboard";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="header">
      <button
        type="button"
        className="header__toggle"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Icon name="menu" />
      </button>

      <h1 className="header__title">{title}</h1>

      <div className="header__actions">
        <div className="header__user">
          <span className="header__username">{user?.username}</span>
          <span className={`role-badge role-badge--${user?.role?.toLowerCase()}`}>
            {user?.role}
          </span>
        </div>

        <button type="button" className="header__logout" onClick={handleLogout}>
          <Icon name="logout" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}