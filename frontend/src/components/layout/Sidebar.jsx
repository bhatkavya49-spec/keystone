import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { getNavItems } from "../../navigation/navConfig";
import Icon from "../Icon";

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const items = getNavItems(user?.role);

  return (
    <aside className={`sidebar${open ? " sidebar--open" : ""}`}>
      <div className="sidebar__brand">
        <div className="sidebar__logo">K</div>
        <span className="sidebar__brand-name">Keystone</span>
        <span className="sidebar__brand-sub">Management System</span>
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) =>
              `sidebar__link${isActive ? " sidebar__link--active" : ""}`
            }
            onClick={onClose}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span className="sidebar__footer-text">{user?.role}</span>
      </div>
    </aside>
  );
}