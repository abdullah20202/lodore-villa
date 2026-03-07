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
  scheduled: { bg: "#D1FAE5", border: "#10B981", text: "#065F46" },
  canceled: { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B" },
  rescheduled: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
};

export default function ReservationsPage() {
  const navigate = useNavigate();

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState(getTodayDate());
  const [dateTo, setDateTo] = useState(getTodayDate());
  const [quickFilter, setQuickFilter] = useState("today");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [username, setUsername] = useState("");

  useEffect(() => {
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

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleQuickFilter = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let from = "";
    let to = "";

    switch (filter) {
      case "today":
        from = formatLocalDate(today);
        to = formatLocalDate(today);
        break;
      case "tomorrow":
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        from = formatLocalDate(tomorrow);
        to = formatLocalDate(tomorrow);
        break;
      case "week":
        from = formatLocalDate(today);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        to = formatLocalDate(weekEnd);
        break;
      case "month":
        from = formatLocalDate(today);
        const monthEnd = new Date(today);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        to = formatLocalDate(monthEnd);
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
      <div className="p-8 max-w-7xl mx-auto" style={{ background: "#F8FAFC", minHeight: "100vh" }}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: "#1E293B" }}>
            الحجوزات
          </h1>
          <p className="text-lg font-medium" style={{ color: "#64748B" }}>
            عرض وإدارة جميع حجوزات Calendly
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 p-6 rounded-xl shadow-lg" style={{ background: "#FFFFFF", border: "2px solid #E2E8F0" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-xs mb-2 font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                البحث (الاسم، الجوال، أو البريد الإلكتروني)
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border-2 font-medium transition-all"
                style={{
                  borderColor: "#E2E8F0",
                  color: "#1E293B",
                  background: "#FFFFFF",
                }}
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
              <label className="block text-xs mb-2 font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                تصفية حسب الحالة
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg border-2 font-bold transition-all"
                style={{
                  borderColor: "#E2E8F0",
                  color: "#1E293B",
                  background: "#FFFFFF",
                }}
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
          <div className="mt-6">
            <label className="block text-xs mb-3 font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
              تصفية حسب التاريخ
            </label>
            <div className="flex flex-wrap gap-2">
              {["today", "tomorrow", "week", "month", "all"].map((filter) => {
                const labels = {
                  today: "اليوم",
                  tomorrow: "غداً",
                  week: "هذا الأسبوع",
                  month: "هذا الشهر",
                  all: "الكل"
                };
                return (
                  <button
                    key={filter}
                    onClick={() => handleQuickFilter(filter)}
                    className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md"
                    style={{
                      background: quickFilter === filter
                        ? "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
                        : "#F1F5F9",
                      border: quickFilter === filter ? "2px solid #3B82F6" : "2px solid #E2E8F0",
                      color: quickFilter === filter ? "#FFF" : "#64748B",
                    }}
                  >
                    {labels[filter]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-2 font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                من تاريخ
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-lg border-2 font-bold transition-all"
                style={{
                  borderColor: "#E2E8F0",
                  color: "#1E293B",
                  background: "#FFFFFF",
                }}
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setQuickFilter("");
                  setPage(1);
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-2 font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                إلى تاريخ
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-lg border-2 font-bold transition-all"
                style={{
                  borderColor: "#E2E8F0",
                  color: "#1E293B",
                  background: "#FFFFFF",
                }}
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
          <div className="mt-6 text-sm font-bold" style={{ color: "#334155" }}>
            الإجمالي: <span style={{ color: "#2563EB" }}>{count}</span> حجز
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div
              className="w-16 h-16 mx-auto rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "#3B82F6", borderTopColor: "transparent" }}
            />
            <p className="mt-4 font-semibold" style={{ color: "#334155" }}>
              جاري التحميل...
            </p>
          </div>
        ) : reservations.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl shadow-lg"
            style={{ background: "#FFFFFF", border: "2px solid #E2E8F0" }}
          >
            <p className="font-bold text-lg" style={{ color: "#64748B" }}>لا توجد حجوزات</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl shadow-lg" style={{ background: "#FFFFFF", border: "2px solid #E2E8F0" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "2px solid #E2E8F0", background: "#F1F5F9" }}>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                      اسم الضيف
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                      رقم الجوال
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                      البريد الإلكتروني
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                      موعد الحجز
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res) => (
                    <tr
                      key={res.id}
                      style={{ borderBottom: "1px solid #E2E8F0" }}
                    >
                      <td className="px-4 py-4 text-sm font-bold" style={{ color: "#1E293B" }}>
                        {res.guest_name || "—"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold" style={{ color: "#1E293B" }}>
                            {res.phone || "—"}
                          </span>
                          {res.phone && (
                            <button
                              onClick={() => copyToClipboard(res.phone)}
                              className="text-xs px-2 py-1 rounded-lg font-bold"
                              style={{ background: "#DBEAFE", color: "#1D4ED8", border: "1px solid #3B82F6" }}
                              title="نسخ"
                            >
                              📋
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium" style={{ color: "#64748B" }}>
                        {res.guest_email || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold" style={{ color: "#1E293B" }}>
                        {formatDateTime(res.scheduled_at)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="text-xs px-3 py-2 rounded-lg border-2 font-bold inline-block"
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
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-6 py-3 rounded-lg text-sm font-bold disabled:opacity-50 shadow-lg transition-all"
                  style={{
                    background: "#FFFFFF",
                    color: "#2563EB",
                    border: "2px solid #3B82F6",
                  }}
                >
                  السابق
                </button>

                <span className="text-sm px-4 font-bold" style={{ color: "#334155" }}>
                  صفحة {page} من {totalPages}
                </span>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-6 py-3 rounded-lg text-sm font-bold disabled:opacity-50 shadow-lg transition-all"
                  style={{
                    background: "#FFFFFF",
                    color: "#2563EB",
                    border: "2px solid #3B82F6",
                  }}
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ManagementLayout>
  );
}
