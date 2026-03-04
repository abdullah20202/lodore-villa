/**
 * /management/dashboard — Management Dashboard
 * Shows overview statistics and trends
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../api/staff";
import { clearTokens } from "../api/client";
import ManagementLayout from "../components/ManagementLayout";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const managementUsername = localStorage.getItem("management_username");
    if (!managementUsername) {
      navigate("/management/login", { replace: true });
      return;
    }
    setUsername(managementUsername);
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    localStorage.removeItem("management_username");
    navigate("/management/login", { replace: true });
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <div
      className="rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium mb-2" style={{ color: "#7A6550" }}>
            {title}
          </p>
          <p className="text-3xl font-bold mb-1" style={{ color: color }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs" style={{ color: "#A8803F" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const TrendChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.count));

    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-xs font-medium" style={{ color: "#7A6550", width: "80px" }}>
              {new Date(item.date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
            </span>
            <div className="flex-1 h-8 rounded-lg overflow-hidden" style={{ background: "rgba(196,149,90,0.1)" }}>
              <div
                className="h-full rounded-lg transition-all duration-500"
                style={{
                  width: `${maxValue > 0 ? (item.count / maxValue) * 100 : 0}%`,
                  background: "linear-gradient(90deg, #E4B77A 0%, #C4955A 100%)",
                }}
              />
            </div>
            <span className="text-sm font-bold" style={{ color: "#C4955A", width: "30px" }}>
              {item.count}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading || !stats) {
    return (
      <ManagementLayout username={username} onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: "#C4955A", borderTopColor: "transparent" }}
            />
            <p style={{ color: "#7A6550" }}>جاري تحميل الإحصائيات...</p>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout username={username} onLogout={handleLogout}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#7A6550" }}>
            لوحة التحكم
          </h1>
          <p className="text-sm" style={{ color: "#A8803F" }}>
            نظرة عامة على جميع البيانات والإحصائيات
          </p>
        </div>

        {/* VIP Stats */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#7A6550" }}>
            إحصائيات العملاء المميزين
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="إجمالي العملاء المميزين"
              value={stats.vip_stats.total}
              subtitle={`${stats.vip_stats.recent_added} مضاف خلال 7 أيام`}
              icon="👥"
              color="#8B4513"
            />
            <StatCard
              title="الحجوزات النشطة"
              value={stats.vip_stats.active_bookings}
              subtitle="حجز نشط حالياً"
              icon="✅"
              color="#2E7D32"
            />
            <StatCard
              title="بدون حجوزات"
              value={stats.vip_stats.total - stats.vip_stats.active_bookings}
              subtitle="متاح للحجز"
              icon="📅"
              color="#1976D2"
            />
          </div>
        </div>

        {/* Reservation Stats */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#7A6550" }}>
            إحصائيات الحجوزات
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="حجوزات اليوم"
              value={stats.reservation_stats.today}
              subtitle="اليوم"
              icon="📆"
              color="#FF6B6B"
            />
            <StatCard
              title="حجوزات الأسبوع"
              value={stats.reservation_stats.week}
              subtitle="هذا الأسبوع"
              icon="📊"
              color="#4ECDC4"
            />
            <StatCard
              title="حجوزات الشهر"
              value={stats.reservation_stats.month}
              subtitle="هذا الشهر"
              icon="📈"
              color="#95E1D3"
            />
            <StatCard
              title="إجمالي الحجوزات"
              value={stats.reservation_stats.total}
              subtitle={`${stats.reservation_stats.recent} خلال 7 أيام`}
              icon="🎯"
              color="#F38181"
            />
          </div>
        </div>

        {/* Status Breakdown & Nominations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Status Breakdown */}
          <div
            className="rounded-xl p-6 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, #FAF9F6 100%)",
              border: "1px solid rgba(196,149,90,0.2)",
            }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: "#7A6550" }}>
              توزيع حالات الحجوزات
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#66BB6A" }} />
                  <span className="text-sm" style={{ color: "#7A6550" }}>محجوز</span>
                </div>
                <span className="text-lg font-bold" style={{ color: "#66BB6A" }}>
                  {stats.reservation_stats.status_breakdown.scheduled}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#EF5350" }} />
                  <span className="text-sm" style={{ color: "#7A6550" }}>ملغي</span>
                </div>
                <span className="text-lg font-bold" style={{ color: "#EF5350" }}>
                  {stats.reservation_stats.status_breakdown.canceled}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#FFB74D" }} />
                  <span className="text-sm" style={{ color: "#7A6550" }}>معاد الجدولة</span>
                </div>
                <span className="text-lg font-bold" style={{ color: "#FFB74D" }}>
                  {stats.reservation_stats.status_breakdown.rescheduled}
                </span>
              </div>
            </div>
          </div>

          {/* Nominations Stats */}
          <div
            className="rounded-xl p-6 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, #FAF9F6 100%)",
              border: "1px solid rgba(196,149,90,0.2)",
            }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: "#7A6550" }}>
              إحصائيات الترشيحات
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#7A6550" }}>إجمالي الترشيحات</span>
                <span className="text-lg font-bold" style={{ color: "#C4955A" }}>
                  {stats.nomination_stats.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#7A6550" }}>في انتظار الموافقة</span>
                <span className="text-lg font-bold" style={{ color: "#FF9800" }}>
                  {stats.nomination_stats.pending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#7A6550" }}>تمت الموافقة</span>
                <span className="text-lg font-bold" style={{ color: "#4CAF50" }}>
                  {stats.nomination_stats.approved}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#7A6550" }}>خلال 7 أيام</span>
                <span className="text-lg font-bold" style={{ color: "#2196F3" }}>
                  {stats.nomination_stats.recent}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Trend */}
        <div
          className="rounded-xl p-6 shadow-lg"
          style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #FAF9F6 100%)",
            border: "1px solid rgba(196,149,90,0.2)",
          }}
        >
          <h3 className="text-lg font-bold mb-6" style={{ color: "#7A6550" }}>
            اتجاه الحجوزات اليومية (آخر 7 أيام)
          </h3>
          <TrendChart data={stats.trends.daily_reservations} />
        </div>
      </div>
    </ManagementLayout>
  );
}
