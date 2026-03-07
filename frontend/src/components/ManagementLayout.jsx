/**
 * Shared layout for management pages with navigation sidebar
 */
import { useNavigate, useLocation } from "react-router-dom";
import { clearTokens } from "../api/client";

export default function ManagementLayout({ children, username }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearTokens();
    localStorage.removeItem("management_username");
    navigate("/management/login", { replace: true });
  };

  const menuItems = [
    {
      label: "لوحة التحكم",
      path: "/management/dashboard",
      icon: "📊",
    },
    {
      label: "الترشيحات",
      path: "/management/nominations",
      icon: "👥",
    },
    {
      label: "الحجوزات",
      path: "/management/reservations",
      icon: "📅",
    },
    {
      label: "إدارة VIP",
      path: "/management/vip",
      icon: "⭐",
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex" dir="rtl" style={{ background: "#F8FAFC" }}>
      {/* Sidebar */}
      <div
        className="w-64 min-h-screen flex flex-col"
        style={{
          background: "#FFFFFF",
          borderLeft: "2px solid #E2E8F0",
          boxShadow: "4px 0 12px rgba(0,0,0,0.05)",
        }}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b-2" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)" }}
            >
              <span className="text-white font-bold text-xl">ل</span>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                لودوريه فيلا
              </h1>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>
                نظام الإدارة
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full px-4 py-3 rounded-xl transition-all font-bold text-right flex items-center gap-3"
                style={{
                  background: isActive(item.path)
                    ? "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
                    : "transparent",
                  color: isActive(item.path) ? "#FFFFFF" : "#64748B",
                  border: isActive(item.path)
                    ? "2px solid #3B82F6"
                    : "2px solid transparent",
                  boxShadow: isActive(item.path)
                    ? "0 4px 12px rgba(59,130,246,0.3)"
                    : "none",
                }}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t-2" style={{ borderColor: "#E2E8F0" }}>
          <div className="mb-3 px-4 py-2 rounded-lg" style={{ background: "#F1F5F9" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#64748B" }}>
              المستخدم
            </p>
            <p className="text-sm font-bold" style={{ color: "#1E293B" }}>
              {username}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-sm px-4 py-3 rounded-lg transition-all font-bold"
            style={{
              background: "#FEE2E2",
              border: "2px solid #EF4444",
              color: "#DC2626",
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
