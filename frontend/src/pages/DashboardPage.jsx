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

  const StatCard = ({ title, value, subtitle, icon, bgColor, accentColor }) => (
    <div
      className="rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
      style={{
        background: "#FFFFFF",
        border: `2px solid ${accentColor}20`,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ background: bgColor }}
        >
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: "#64748B" }}>
        {title}
      </h3>
      <p className="text-4xl font-bold mb-1" style={{ color: accentColor }}>
        {value}
      </p>
      {subtitle && (
        <p className="text-sm font-medium" style={{ color: "#94A3B8" }}>
          {subtitle}
        </p>
      )}
    </div>
  );

  const TrendChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.count), 1);

    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <span className="text-sm font-bold" style={{ color: "#334155", width: "100px" }}>
              {new Date(item.date).toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <div className="flex-1 h-12 rounded-lg overflow-hidden" style={{ background: "#F1F5F9" }}>
              <div
                className="h-full rounded-lg transition-all duration-500 flex items-center justify-end px-4"
                style={{
                  width: `${(item.count / maxValue) * 100}%`,
                  background: "linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)",
                  minWidth: item.count > 0 ? "50px" : "0",
                }}
              >
                {item.count > 0 && (
                  <span className="text-sm font-bold text-white">{item.count}</span>
                )}
              </div>
            </div>
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
              style={{ borderColor: "#3B82F6", borderTopColor: "transparent" }}
            />
            <p className="font-semibold" style={{ color: "#334155" }}>جاري تحميل الإحصائيات...</p>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout username={username} onLogout={handleLogout}>
      <div className="p-8 max-w-7xl mx-auto" style={{ background: "#F8FAFC", minHeight: "100vh" }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: "#1E293B" }}>
            لوحة التحكم
          </h1>
          <p className="text-lg font-medium" style={{ color: "#64748B" }}>
            نظرة عامة على جميع البيانات والإحصائيات
          </p>
        </div>

        {/* VIP Stats */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#1E293B" }}>
            إحصائيات العملاء المميزين
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="إجمالي العملاء المميزين"
              value={stats.vip_stats.total.toLocaleString()}
              subtitle={`${stats.vip_stats.recent_added} مضاف خلال 7 أيام`}
              icon="👥"
              bgColor="#DBEAFE"
              accentColor="#1D4ED8"
            />
            <StatCard
              title="الحجوزات النشطة"
              value={stats.vip_stats.active_bookings.toLocaleString()}
              subtitle="حجز نشط حالياً"
              icon="✅"
              bgColor="#D1FAE5"
              accentColor="#059669"
            />
            <StatCard
              title="متاح للحجز"
              value={(stats.vip_stats.total - stats.vip_stats.active_bookings).toLocaleString()}
              subtitle="بدون حجوزات"
              icon="📅"
              bgColor="#E0E7FF"
              accentColor="#4F46E5"
            />
          </div>
        </div>

        {/* Reservation Stats */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#1E293B" }}>
            إحصائيات الحجوزات
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="حجوزات اليوم"
              value={stats.reservation_stats.today.toLocaleString()}
              subtitle="اليوم"
              icon="📆"
              bgColor="#FEF3C7"
              accentColor="#D97706"
            />
            <StatCard
              title="حجوزات الأسبوع"
              value={stats.reservation_stats.week.toLocaleString()}
              subtitle="هذا الأسبوع"
              icon="📊"
              bgColor="#DBEAFE"
              accentColor="#2563EB"
            />
            <StatCard
              title="حجوزات الشهر"
              value={stats.reservation_stats.month.toLocaleString()}
              subtitle="هذا الشهر"
              icon="📈"
              bgColor="#E9D5FF"
              accentColor="#9333EA"
            />
            <StatCard
              title="إجمالي الحجوزات"
              value={stats.reservation_stats.total.toLocaleString()}
              subtitle={`${stats.reservation_stats.recent} خلال 7 أيام`}
              icon="🎯"
              bgColor="#FED7AA"
              accentColor="#EA580C"
            />
          </div>
        </div>

        {/* Status Breakdown & Nominations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Status Breakdown */}
          <div
            className="rounded-xl p-6 shadow-lg"
            style={{
              background: "#FFFFFF",
              border: "2px solid #E2E8F0",
            }}
          >
            <h3 className="text-xl font-bold mb-6" style={{ color: "#1E293B" }}>
              توزيع حالات الحجوزات
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "#D1FAE5", border: "2px solid #10B981" }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#059669" }} />
                  <span className="text-base font-bold" style={{ color: "#065F46" }}>محجوز</span>
                </div>
                <span className="text-3xl font-bold" style={{ color: "#059669" }}>
                  {stats.reservation_stats.status_breakdown.scheduled}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "#FEE2E2", border: "2px solid #EF4444" }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#DC2626" }} />
                  <span className="text-base font-bold" style={{ color: "#991B1B" }}>ملغي</span>
                </div>
                <span className="text-3xl font-bold" style={{ color: "#DC2626" }}>
                  {stats.reservation_stats.status_breakdown.canceled}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "#FEF3C7", border: "2px solid #F59E0B" }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#D97706" }} />
                  <span className="text-base font-bold" style={{ color: "#92400E" }}>معاد الجدولة</span>
                </div>
                <span className="text-3xl font-bold" style={{ color: "#D97706" }}>
                  {stats.reservation_stats.status_breakdown.rescheduled}
                </span>
              </div>
            </div>
          </div>

          {/* Nominations Stats */}
          <div
            className="rounded-xl p-6 shadow-lg"
            style={{
              background: "#FFFFFF",
              border: "2px solid #E2E8F0",
            }}
          >
            <h3 className="text-xl font-bold mb-6" style={{ color: "#1E293B" }}>
              إحصائيات الترشيحات
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "#DBEAFE", border: "2px solid #3B82F6" }}>
                <span className="text-base font-bold" style={{ color: "#1E40AF" }}>إجمالي الترشيحات</span>
                <span className="text-3xl font-bold" style={{ color: "#2563EB" }}>
                  {stats.nomination_stats.total}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "#FED7AA", border: "2px solid #F97316" }}>
                <span className="text-base font-bold" style={{ color: "#9A3412" }}>في انتظار الموافقة</span>
                <span className="text-3xl font-bold" style={{ color: "#EA580C" }}>
                  {stats.nomination_stats.pending}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "#D1FAE5", border: "2px solid #10B981" }}>
                <span className="text-base font-bold" style={{ color: "#065F46" }}>تمت الموافقة</span>
                <span className="text-3xl font-bold" style={{ color: "#059669" }}>
                  {stats.nomination_stats.approved}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Trend */}
        <div
          className="rounded-xl p-6 shadow-lg"
          style={{
            background: "#FFFFFF",
            border: "2px solid #E2E8F0",
          }}
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: "#1E293B" }}>
            اتجاه الحجوزات اليومية (آخر 7 أيام)
          </h3>
          <TrendChart data={stats.trends.daily_reservations} />
        </div>
      </div>
    </ManagementLayout>
  );
}
