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

  const StatCard = ({ title, value, subtitle, icon, gradient }) => (
    <div
      className="rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border"
      style={{
        background: gradient,
        borderColor: "rgba(196,149,90,0.2)",
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: "rgba(255,255,255,0.9)" }}
        >
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
      <h3 className="text-sm font-medium mb-2" style={{ color: "#7A6550" }}>
        {title}
      </h3>
      <p className="text-4xl font-bold mb-1" style={{ color: "#C4955A" }}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs" style={{ color: "#A8803F" }}>
          {subtitle}
        </p>
      )}
    </div>
  );

  const TrendChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.count), 1);

    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <span className="text-sm font-medium" style={{ color: "#7A6550", width: "90px" }}>
              {new Date(item.date).toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <div className="flex-1 h-10 rounded-xl overflow-hidden" style={{ background: "rgba(196,149,90,0.08)" }}>
              <div
                className="h-full rounded-xl transition-all duration-500 flex items-center justify-end px-3"
                style={{
                  width: `${(item.count / maxValue) * 100}%`,
                  background: "linear-gradient(90deg, #E4B77A 0%, #C4955A 100%)",
                  minWidth: item.count > 0 ? "40px" : "0",
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
      <div className="p-8 max-w-7xl mx-auto" style={{ background: "#FAF9F6", minHeight: "100vh" }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: "#7A6550" }}>
            لوحة التحكم
          </h1>
          <p className="text-base" style={{ color: "#A8803F" }}>
            نظرة عامة على جميع البيانات والإحصائيات
          </p>
        </div>

        {/* VIP Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-5" style={{ color: "#7A6550" }}>
            إحصائيات العملاء المميزين
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="إجمالي العملاء المميزين"
              value={stats.vip_stats.total.toLocaleString()}
              subtitle={`${stats.vip_stats.recent_added} مضاف خلال 7 أيام`}
              icon="👥"
              gradient="linear-gradient(135deg, #FFF9F0 0%, #FFFFFF 100%)"
            />
            <StatCard
              title="الحجوزات النشطة"
              value={stats.vip_stats.active_bookings.toLocaleString()}
              subtitle="حجز نشط حالياً"
              icon="✅"
              gradient="linear-gradient(135deg, #F0FFF4 0%, #FFFFFF 100%)"
            />
            <StatCard
              title="متاح للحجز"
              value={(stats.vip_stats.total - stats.vip_stats.active_bookings).toLocaleString()}
              subtitle="بدون حجوزات"
              icon="📅"
              gradient="linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 100%)"
            />
          </div>
        </div>

        {/* Reservation Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-5" style={{ color: "#7A6550" }}>
            إحصائيات الحجوزات
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="حجوزات اليوم"
              value={stats.reservation_stats.today.toLocaleString()}
              subtitle="اليوم"
              icon="📆"
              gradient="linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 100%)"
            />
            <StatCard
              title="حجوزات الأسبوع"
              value={stats.reservation_stats.week.toLocaleString()}
              subtitle="هذا الأسبوع"
              icon="📊"
              gradient="linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)"
            />
            <StatCard
              title="حجوزات الشهر"
              value={stats.reservation_stats.month.toLocaleString()}
              subtitle="هذا الشهر"
              icon="📈"
              gradient="linear-gradient(135deg, #F5F3FF 0%, #FFFFFF 100%)"
            />
            <StatCard
              title="إجمالي الحجوزات"
              value={stats.reservation_stats.total.toLocaleString()}
              subtitle={`${stats.reservation_stats.recent} خلال 7 أيام`}
              icon="🎯"
              gradient="linear-gradient(135deg, #FFF9F0 0%, #FFFFFF 100%)"
            />
          </div>
        </div>

        {/* Status Breakdown & Nominations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Status Breakdown */}
          <div
            className="rounded-2xl p-6 shadow-sm border"
            style={{
              background: "#FFFFFF",
              borderColor: "rgba(196,149,90,0.2)",
            }}
          >
            <h3 className="text-xl font-bold mb-6" style={{ color: "#7A6550" }}>
              توزيع حالات الحجوزات
            </h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(102,187,106,0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ background: "#66BB6A" }} />
                  <span className="text-base font-medium" style={{ color: "#7A6550" }}>محجوز</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: "#66BB6A" }}>
                  {stats.reservation_stats.status_breakdown.scheduled}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(239,83,80,0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ background: "#EF5350" }} />
                  <span className="text-base font-medium" style={{ color: "#7A6550" }}>ملغي</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: "#EF5350" }}>
                  {stats.reservation_stats.status_breakdown.canceled}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(255,183,77,0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ background: "#FFB74D" }} />
                  <span className="text-base font-medium" style={{ color: "#7A6550" }}>معاد الجدولة</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: "#FFB74D" }}>
                  {stats.reservation_stats.status_breakdown.rescheduled}
                </span>
              </div>
            </div>
          </div>

          {/* Nominations Stats */}
          <div
            className="rounded-2xl p-6 shadow-sm border"
            style={{
              background: "#FFFFFF",
              borderColor: "rgba(196,149,90,0.2)",
            }}
          >
            <h3 className="text-xl font-bold mb-6" style={{ color: "#7A6550" }}>
              إحصائيات الترشيحات
            </h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(196,149,90,0.08)" }}>
                <span className="text-base font-medium" style={{ color: "#7A6550" }}>إجمالي الترشيحات</span>
                <span className="text-2xl font-bold" style={{ color: "#C4955A" }}>
                  {stats.nomination_stats.total}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(255,152,0,0.08)" }}>
                <span className="text-base font-medium" style={{ color: "#7A6550" }}>في انتظار الموافقة</span>
                <span className="text-2xl font-bold" style={{ color: "#FF9800" }}>
                  {stats.nomination_stats.pending}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(76,175,80,0.08)" }}>
                <span className="text-base font-medium" style={{ color: "#7A6550" }}>تمت الموافقة</span>
                <span className="text-2xl font-bold" style={{ color: "#4CAF50" }}>
                  {stats.nomination_stats.approved}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Trend */}
        <div
          className="rounded-2xl p-6 shadow-sm border"
          style={{
            background: "#FFFFFF",
            borderColor: "rgba(196,149,90,0.2)",
          }}
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: "#7A6550" }}>
            اتجاه الحجوزات اليومية (آخر 7 أيام)
          </h3>
          <TrendChart data={stats.trends.daily_reservations} />
        </div>
      </div>
    </ManagementLayout>
  );
}
