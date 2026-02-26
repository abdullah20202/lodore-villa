/**
 * /management/dashboard — Management Dashboard
 * Main dashboard for managing events, guests, and nominations
 *
 * Current Features:
 * - Guest Nominations Management
 *
 * Future Features (expandable):
 * - VIP Guest List Management
 * - Event Analytics
 * - Booking Management
 * - Communication Tools
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getNominations, updateNominationStatus } from "../api/staff";
import { clearTokens } from "../api/client";

const STATUS_OPTIONS = [
  { value: "", label: "جميع الحالات" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "contacted", label: "تم التواصل" },
  { value: "invited", label: "تم الدعوة" },
  { value: "confirmed", label: "مؤكد" },
];

const STATUS_COLORS = {
  pending: { bg: "#FFF8E1", border: "#FFB74D", text: "#E65100" },
  contacted: { bg: "#E3F2FD", border: "#64B5F6", text: "#1565C0" },
  invited: { bg: "#F3E5F5", border: "#BA68C8", text: "#6A1B9A" },
  confirmed: { bg: "#E8F5E9", border: "#66BB6A", text: "#2E7D32" },
};

export default function ManagementDashboardPage() {
  const navigate = useNavigate();
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [username, setUsername] = useState("");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const managementUsername = localStorage.getItem("management_username");
    if (!managementUsername) {
      navigate("/management/login", { replace: true });
      return;
    }
    setUsername(managementUsername);
    loadNominations();
  }, [search, statusFilter, page, navigate]);

  const loadNominations = async () => {
    setLoading(true);
    try {
      const data = await getNominations({
        search,
        status: statusFilter,
        page,
        page_size: 20,
      });

      if (data.ok) {
        setNominations(data.results);
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

  const handleStatusUpdate = async (nominationId, newStatus) => {
    try {
      const result = await updateNominationStatus(nominationId, newStatus);
      if (result.ok) {
        // Update local state
        setNominations((prev) =>
          prev.map((n) => (n.id === nominationId ? { ...n, status: newStatus } : n))
        );
      }
    } catch (err) {
      alert("Failed to update status");
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

  const handleExportExcel = async () => {
    try {
      // Prepare IDs to export
      let idsParam = '';
      if (selectedRows.size > 0) {
        const ids = Array.from(selectedRows).join(',');
        idsParam = `&ids=${ids}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/management/nominations/export?search=${search}&status=${statusFilter}${idsParam}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Export failed:', response.status, response.statusText);
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nominations_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Clear selection after export
      setSelectedRows(new Set());
      setSelectAll(false);
    } catch (err) {
      console.error('Export error:', err);
      alert('فشل تصدير الملف');
    }
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      const allIds = new Set(nominations.map(n => n.id));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === nominations.length);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "linear-gradient(135deg, #1a3449 0%, #25496b 100%)" }}>
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
              لودوريه فيلا - إدارة الفعاليات
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
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(196,149,90,0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(196,149,90,0.1)";
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#F5EFE7", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            ترشيحات الضيوف
          </h2>
          <p className="text-sm" style={{ color: "#E8DCC8", textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
            إدارة ومتابعة ترشيحات الضيوف من عملاء VIP
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 p-6 rounded-xl" style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-xs mb-2 font-medium" style={{ color: "#7A6550" }}>
                البحث (الاسم أو رقم الجوال)
              </label>
              <input
                type="text"
                className="vip-input"
                placeholder="ابحث بالاسم أو رقم الجوال..."
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

          {/* Count and Export */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm" style={{ color: "#7A6550" }}>
              الإجمالي: <strong>{count}</strong> ترشيح
              {selectedRows.size > 0 && (
                <span className="mr-3" style={{ color: "#C4955A" }}>
                  • المحدد: <strong>{selectedRows.size}</strong>
                </span>
              )}
            </div>
            <button
              onClick={handleExportExcel}
              disabled={selectedRows.size === 0 && count > 0}
              className="text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2"
              style={{
                background: selectedRows.size === 0 && count > 0
                  ? "rgba(196,149,90,0.3)"
                  : "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)",
                color: "#FFFFFF",
                border: "none",
                boxShadow: "0 2px 8px rgba(196,149,90,0.3)",
                cursor: selectedRows.size === 0 && count > 0 ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (selectedRows.size > 0 || count === 0) {
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(196,149,90,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 8px rgba(196,149,90,0.3)";
              }}
            >
              📥 تصدير المحدد ({selectedRows.size > 0 ? selectedRows.size : 'اختر صفوف'})
            </button>
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
        ) : nominations.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl"
            style={{ background: "rgba(255,255,255,0.95)" }}
          >
            <p style={{ color: "#7A6550" }}>لا توجد ترشيحات</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl" style={{ background: "rgba(255,255,255,0.95)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(196,149,90,0.2)" }}>
                    <th className="px-4 py-3 text-center" style={{ color: "#7A6550", width: "50px" }}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                        style={{ accentColor: "#C4955A" }}
                      />
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "#7A6550" }}>
                      اسم الضيف
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "#7A6550" }}>
                      رقم الضيف
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "#7A6550" }}>
                      المرشِّح
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "#7A6550" }}>
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "#7A6550" }}>
                      تاريخ الإنشاء
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "#7A6550" }}>
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nominations.map((nom) => (
                    <tr
                      key={nom.id}
                      style={{
                        borderBottom: "1px solid rgba(196,149,90,0.1)",
                        background: selectedRows.has(nom.id) ? "rgba(228,183,122,0.1)" : "transparent"
                      }}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(nom.id)}
                          onChange={() => handleSelectRow(nom.id)}
                          className="w-4 h-4 cursor-pointer"
                          style={{ accentColor: "#C4955A" }}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#2C2416" }}>
                        {nom.invited_name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono" style={{ color: "#2C2416" }}>
                            {nom.invited_phone}
                          </span>
                          <button
                            onClick={() => copyToClipboard(nom.invited_phone)}
                            className="text-xs px-2 py-1 rounded"
                            style={{ background: "rgba(196,149,90,0.1)", color: "#A8803F" }}
                            title="نسخ"
                          >
                            📋
                          </button>
                          <a
                            href={`https://wa.me/${nom.invited_phone.replace(/^0/, '966')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded"
                            style={{ background: "rgba(37,211,102,0.1)", color: "#25D366" }}
                            title="WhatsApp"
                          >
                            💬
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#7A6550" }}>
                        {nom.inviter_name ? (
                          <div>
                            <div style={{ color: "#2C2416", fontWeight: "500" }}>{nom.inviter_name}</div>
                            <div className="font-mono text-xs" style={{ color: "#9A8060" }}>{nom.inviter_phone}</div>
                          </div>
                        ) : (
                          <div className="font-mono">{nom.inviter_phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={nom.status}
                          onChange={(e) => handleStatusUpdate(nom.id, e.target.value)}
                          className="text-xs px-3 py-1.5 rounded-lg border font-medium"
                          style={{
                            background: STATUS_COLORS[nom.status]?.bg || "#FFF",
                            borderColor: STATUS_COLORS[nom.status]?.border || "#DDD",
                            color: STATUS_COLORS[nom.status]?.text || "#000",
                          }}
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="contacted">تم التواصل</option>
                          <option value="invited">تم الدعوة</option>
                          <option value="confirmed">مؤكد</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#9A8060" }}>
                        {formatDate(nom.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {nom.approved && (
                          <span
                            className="text-xs px-2 py-1 rounded"
                            style={{ background: "rgba(76,175,80,0.1)", color: "#4CAF50" }}
                          >
                            ✓ تمت الموافقة
                          </span>
                        )}
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
      </div>
    </div>
  );
}
