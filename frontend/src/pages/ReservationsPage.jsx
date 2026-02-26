/**
 * /management/reservations — Reservations Management Page
 * View and manage all Calendly reservations
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getReservations } from "../api/staff";
import { clearTokens } from "../api/client";
import ManagementLayout from "../components/ManagementLayout";

const STATUS_OPTIONS = [
  { value: "", label: "جميع الحالات" },
  { value: "scheduled", label: "محجوز" },
  { value: "canceled", label: "ملغي" },
  { value: "rescheduled", label: "معاد الجدولة" },
];

const STATUS_COLORS = {
  scheduled: { bg: "#E8F5E9", border: "#66BB6A", text: "#2E7D32" },
  canceled: { bg: "#FFEBEE", border: "#EF5350", text: "#C62828" },
  rescheduled: { bg: "#FFF8E1", border: "#FFB74D", text: "#E65100" },
};

export default function ReservationsPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [quickFilter, setQuickFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const managementUsername = localStorage.getItem("management_username");
    if (!managementUsername) {
      navigate("/management/login", { replace: true });
      return;
    }
    setUsername(managementUsername);
    loadReservations();
  }, [search, statusFilter, dateFrom, dateTo, page, navigate]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const data = await getReservations({
        search,
        status: statusFilter,
        date_from: dateFrom,
        date_to: dateTo,
        page,
        page_size: 20,
      });

      if (data.ok) {
        setReservations(data.results);
        setCount(data.count);
        setTotalPages(data.total_pages);
      }
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("تم النسخ!");
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleQuickFilter = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let from = "";
    let to = "";

    switch (filter) {
      case "today":
        from = today.toISOString().split('T')[0];
        to = today.toISOString().split('T')[0];
        break;
      case "tomorrow":
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        from = tomorrow.toISOString().split('T')[0];
        to = tomorrow.toISOString().split('T')[0];
        break;
      case "week":
        from = today.toISOString().split('T')[0];
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        to = weekEnd.toISOString().split('T')[0];
        break;
      case "month":
        from = today.toISOString().split('T')[0];
        const monthEnd = new Date(today);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        to = monthEnd.toISOString().split('T')[0];
        break;
      case "all":
        from = "";
        to = "";
        break;
      default:
        break;
    }

    setDateFrom(from);
    setDateTo(to);
    setQuickFilter(filter);
    setPage(1);
  };

  return (
    <ManagementLayout username={username}>
      {/* Section Title */}
      <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#F5EFE7", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            الحجوزات
          </h2>
          <p className="text-sm" style={{ color: "#E8DCC8", textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
            عرض وإدارة جميع حجوزات Calendly
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 p-6 rounded-xl" style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-xs mb-2 font-medium" style={{ color: "#7A6550" }}>
                البحث (الاسم، الجوال، أو البريد الإلكتروني)
              </label>
              <input
                type="text"
                className="vip-input"
                placeholder="ابحث..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs mb-2 font-medium" style={{ color: "#7A6550" }}>
                تصفية حسب الحالة
              </label>
              <select
                className="vip-input"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Quick Filters */}
          <div className="mt-4">
            <label className="block text-xs mb-2 font-medium" style={{ color: "#7A6550" }}>
              تصفية حسب التاريخ
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickFilter("today")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === "today" ? "shadow-md" : ""}`}
                style={{
                  background: quickFilter === "today" ? "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)" : "rgba(196,149,90,0.1)",
                  border: "1px solid rgba(196,149,90,0.3)",
                  color: quickFilter === "today" ? "#FFF" : "#A8803F",
                }}
              >
                اليوم
              </button>
              <button
                onClick={() => handleQuickFilter("tomorrow")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === "tomorrow" ? "shadow-md" : ""}`}
                style={{
                  background: quickFilter === "tomorrow" ? "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)" : "rgba(196,149,90,0.1)",
                  border: "1px solid rgba(196,149,90,0.3)",
                  color: quickFilter === "tomorrow" ? "#FFF" : "#A8803F",
                }}
              >
                غداً
              </button>
              <button
                onClick={() => handleQuickFilter("week")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === "week" ? "shadow-md" : ""}`}
                style={{
                  background: quickFilter === "week" ? "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)" : "rgba(196,149,90,0.1)",
                  border: "1px solid rgba(196,149,90,0.3)",
                  color: quickFilter === "week" ? "#FFF" : "#A8803F",
                }}
              >
                هذا الأسبوع
              </button>
              <button
                onClick={() => handleQuickFilter("month")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === "month" ? "shadow-md" : ""}`}
                style={{
                  background: quickFilter === "month" ? "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)" : "rgba(196,149,90,0.1)",
                  border: "1px solid rgba(196,149,90,0.3)",
                  color: quickFilter === "month" ? "#FFF" : "#A8803F",
                }}
              >
                هذا الشهر
              </button>
              <button
                onClick={() => handleQuickFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === "all" ? "shadow-md" : ""}`}
                style={{
                  background: quickFilter === "all" ? "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)" : "rgba(196,149,90,0.1)",
                  border: "1px solid rgba(196,149,90,0.3)",
                  color: quickFilter === "all" ? "#FFF" : "#A8803F",
                }}
              >
                الكل
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-2 font-medium" style={{ color: "#7A6550" }}>
                من تاريخ
              </label>
              <input
                type="date"
                className="vip-input"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setQuickFilter("");
                  setPage(1);
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-2 font-medium" style={{ color: "#7A6550" }}>
                إلى تاريخ
              </label>
              <input
                type="date"
                className="vip-input"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setQuickFilter("");
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Count */}
          <div className="mt-4 text-sm" style={{ color: "#7A6550" }}>
            الإجمالي: <strong>{count}</strong> حجز
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div
              className="w-10 h-10 mx-auto rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(228,183,122,0.3)", borderTopColor: "#E4B77A" }}
            />
            <p className="mt-4 text-sm" style={{ color: "#E8DCC8" }}>
              جاري التحميل...
            </p>
          </div>
        ) : reservations.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl"
            style={{ background: "rgba(255,255,255,0.95)" }}
          >
            <p style={{ color: "#7A6550" }}>لا توجد حجوزات</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl" style={{ background: "rgba(255,255,255,0.95)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(196,149,90,0.2)" }}>
                    <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "#7A6550" }}>
                      اسم الضيف
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "#7A6550" }}>
                      رقم الجوال
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "#7A6550" }}>
                      البريد الإلكتروني
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "#7A6550" }}>
                      موعد الحجز
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "#7A6550" }}>
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res) => (
                    <tr
                      key={res.id}
                      style={{ borderBottom: "1px solid rgba(196,149,90,0.1)" }}
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: "#2C2416" }}>
                        {res.guest_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono" style={{ color: "#2C2416" }}>
                            {res.phone || "—"}
                          </span>
                          {res.phone && (
                            <button
                              onClick={() => copyToClipboard(res.phone)}
                              className="text-xs px-2 py-1 rounded"
                              style={{ background: "rgba(196,149,90,0.1)", color: "#A8803F" }}
                              title="نسخ"
                            >
                              📋
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#7A6550" }}>
                        {res.guest_email || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#2C2416" }}>
                        {formatDateTime(res.scheduled_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-3 py-1.5 rounded-lg border font-medium inline-block"
                          style={{
                            background: STATUS_COLORS[res.status]?.bg || "#FFF",
                            borderColor: STATUS_COLORS[res.status]?.border || "#DDD",
                            color: STATUS_COLORS[res.status]?.text || "#000",
                          }}
                        >
                          {STATUS_OPTIONS.find(o => o.value === res.status)?.label || res.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    color: "#A8803F",
                    border: "1px solid rgba(196,149,90,0.3)",
                  }}
                >
                  السابق
                </button>

                <span className="text-sm px-4" style={{ color: "#E8DCC8" }}>
                  صفحة {page} من {totalPages}
                </span>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    color: "#A8803F",
                    border: "1px solid rgba(196,149,90,0.3)",
                  }}
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
    </ManagementLayout>
  );
}
