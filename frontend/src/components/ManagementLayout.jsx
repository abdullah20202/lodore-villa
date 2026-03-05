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
    <div className="min-h-screen" dir="rtl" style={{ background: "#FAF9F6" }}>
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(255,255,255,0.95)",
          borderBottom: "2px solid rgba(196,149,90,0.3)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)" }}
          >
            <span className="text-white font-bold text-lg">ل</span>
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#2C2416" }}>
              لوحة الإدارة
            </h1>
            <p className="text-xs" style={{ color: "#7A6550" }}>
              لودوريه فيلا - نظام الإدارة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: "#7A6550" }}>
            {username}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 rounded-lg transition-all"
            style={{
              background: "rgba(196,149,90,0.1)",
              border: "1px solid rgba(196,149,90,0.3)",
              color: "#A8803F",
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-3 mb-6">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="px-6 py-3 rounded-xl transition-all font-medium"
              style={{
                background: isActive(item.path)
                  ? "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)"
                  : "rgba(255,255,255,0.95)",
                color: isActive(item.path) ? "#FFFFFF" : "#7A6550",
                border: isActive(item.path)
                  ? "2px solid rgba(196,149,90,0.5)"
                  : "2px solid rgba(196,149,90,0.2)",
                boxShadow: isActive(item.path)
                  ? "0 4px 16px rgba(228,183,122,0.3)"
                  : "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <span className="ml-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
