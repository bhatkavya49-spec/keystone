import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <div className="app-main">
        <Header onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}