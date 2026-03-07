/**
 * /management/nominations — Nominations Management
 * Manage and track guest nominations from VIP customers
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getNominations, updateNominationStatus } from "../api/staff";
import { clearTokens } from "../api/client";
import ManagementLayout from "../components/ManagementLayout";

const STATUS_OPTIONS = [
  { value: "", label: "جميع الحالات" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "contacted", label: "تم التواصل" },
  { value: "invited", label: "تم الدعوة" },
  { value: "confirmed", label: "مؤكد" },
];

const STATUS_COLORS = {
  pending: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
  contacted: { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF" },
  invited: { bg: "#E9D5FF", border: "#9333EA", text: "#6B21A8" },
  confirmed: { bg: "#D1FAE5", border: "#10B981", text: "#065F46" },
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
  const [selectAllPages, setSelectAllPages] = useState(false);

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
      let exportParam = '';
      if (selectAllPages) {
        exportParam = '&export_all=true';
      } else if (selectedRows.size > 0) {
        const ids = Array.from(selectedRows).join(',');
        exportParam = `&ids=${ids}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/management/nominations/export?search=${search}&status=${statusFilter}${exportParam}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
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

      setSelectedRows(new Set());
      setSelectAll(false);
      setSelectAllPages(false);
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
    setSelectAllPages(false);
  };

  const handleSelectAllPages = (e) => {
    const checked = e.target.checked;
    setSelectAllPages(checked);
    if (checked) {
      setSelectedRows(new Set());
      setSelectAll(false);
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
    setSelectAllPages(false);
  };

  const handleConvertToVIP = async () => {
    if (selectedRows.size === 0) {
      alert("يرجى تحديد ترشيحات للتحويل");
      return;
    }

    if (!confirm(`هل تريد تحويل ${selectedRows.size} ضيف إلى VIP؟`)) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/management/nominations/convert-to-vip`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: Array.from(selectedRows),
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.ok) {
        alert(data.message);
        setSelectedRows(new Set());
        setSelectAll(false);
        setSelectAllPages(false);
        loadNominations();
      } else {
        alert(data.message || "فشل التحويل");
      }
    } catch (error) {
      console.error('Convert to VIP error:', error);
      alert("حدث خطأ أثناء التحويل");
    }
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
    <ManagementLayout username={username}>
      <div className="p-8 max-w-7xl mx-auto" style={{ background: "#F8FAFC", minHeight: "100vh" }}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: "#1E293B" }}>
            ترشيحات الضيوف
          </h1>
          <p className="text-lg font-medium" style={{ color: "#64748B" }}>
            إدارة ومتابعة ترشيحات الضيوف من عملاء VIP
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 p-6 rounded-xl shadow-lg" style={{ background: "#FFFFFF", border: "2px solid #E2E8F0" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-xs mb-2 font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                البحث (الاسم أو رقم الجوال)
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border-2 font-medium transition-all"
                style={{
                  borderColor: "#E2E8F0",
                  color: "#1E293B",
                  background: "#FFFFFF",
                }}
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

          {/* Count and Actions */}
          <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="text-sm font-bold" style={{ color: "#334155" }}>
                الإجمالي: <span style={{ color: "#2563EB" }}>{count}</span> ترشيح
                {selectAllPages && (
                  <span className="mr-3" style={{ color: "#059669" }}>
                    • المحدد: <strong>الكل ({count})</strong>
                  </span>
                )}
                {!selectAllPages && selectedRows.size > 0 && (
                  <span className="mr-3" style={{ color: "#059669" }}>
                    • المحدد: <strong>{selectedRows.size}</strong>
                  </span>
                )}
              </div>

              {/* Select All Pages Checkbox */}
              <label className="flex items-center gap-2 text-sm font-bold cursor-pointer" style={{ color: "#64748B" }}>
                <input
                  type="checkbox"
                  checked={selectAllPages}
                  onChange={handleSelectAllPages}
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: "#3B82F6" }}
                />
                <span>تحديد الكل ({count})</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExportExcel}
                disabled={!selectAllPages && selectedRows.size === 0 && count > 0}
                className="text-sm px-6 py-3 rounded-lg transition-all font-bold flex items-center gap-2 shadow-lg"
                style={{
                  background: (!selectAllPages && selectedRows.size === 0 && count > 0)
                    ? "#CBD5E1"
                    : "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                  color: "#FFFFFF",
                  border: "2px solid #3B82F6",
                  cursor: (!selectAllPages && selectedRows.size === 0 && count > 0) ? "not-allowed" : "pointer",
                }}
              >
                📥 تصدير المحدد (
                  {selectAllPages ? `الكل ${count}` : selectedRows.size > 0 ? selectedRows.size : 'اختر صفوف'}
                )
              </button>

              <button
                onClick={handleConvertToVIP}
                disabled={selectedRows.size === 0}
                className="text-sm px-6 py-3 rounded-lg transition-all font-bold flex items-center gap-2 shadow-lg"
                style={{
                  background: selectedRows.size === 0
                    ? "#CBD5E1"
                    : "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  color: "#FFFFFF",
                  border: "2px solid #10B981",
                  cursor: selectedRows.size === 0 ? "not-allowed" : "pointer",
                }}
              >
                ⭐ تحويل إلى VIP ({selectedRows.size > 0 ? selectedRows.size : 'اختر صفوف'})
              </button>
            </div>
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
        ) : nominations.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl shadow-lg"
            style={{ background: "#FFFFFF", border: "2px solid #E2E8F0" }}
          >
            <p className="font-bold text-lg" style={{ color: "#64748B" }}>لا توجد ترشيحات</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl shadow-lg" style={{ background: "#FFFFFF", border: "2px solid #E2E8F0" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "2px solid #E2E8F0", background: "#F1F5F9" }}>
                    <th className="px-4 py-4 text-center" style={{ color: "#334155", width: "50px" }}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                        style={{ accentColor: "#3B82F6" }}
                      />
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                      اسم الضيف
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                      رقم الضيف
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                      المرشِّح
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                      الحالة
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                      تاريخ الإنشاء
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nominations.map((nom) => (
                    <tr
                      key={nom.id}
                      style={{
                        borderBottom: "1px solid #E2E8F0",
                        background: selectedRows.has(nom.id) ? "#EFF6FF" : "transparent"
                      }}
                    >
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(nom.id)}
                          onChange={() => handleSelectRow(nom.id)}
                          className="w-4 h-4 cursor-pointer"
                          style={{ accentColor: "#3B82F6" }}
                        />
                      </td>
                      <td className="px-4 py-4 text-sm font-bold" style={{ color: "#1E293B" }}>
                        {nom.invited_name}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold" style={{ color: "#1E293B" }}>
                            {nom.invited_phone}
                          </span>
                          <button
                            onClick={() => copyToClipboard(nom.invited_phone)}
                            className="text-xs px-2 py-1 rounded-lg font-bold"
                            style={{ background: "#DBEAFE", color: "#1D4ED8", border: "1px solid #3B82F6" }}
                            title="نسخ"
                          >
                            📋
                          </button>
                          <a
                            href={`https://wa.me/${nom.invited_phone.replace(/^0/, '966')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded-lg font-bold"
                            style={{ background: "#D1FAE5", color: "#059669", border: "1px solid #10B981" }}
                            title="WhatsApp"
                          >
                            💬
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm" style={{ color: "#64748B" }}>
                        {nom.inviter_name ? (
                          <div>
                            <div className="font-bold" style={{ color: "#1E293B" }}>{nom.inviter_name}</div>
                            <div className="font-mono text-xs" style={{ color: "#64748B" }}>{nom.inviter_phone}</div>
                          </div>
                        ) : (
                          <div className="font-mono font-bold">{nom.inviter_phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={nom.status}
                          onChange={(e) => handleStatusUpdate(nom.id, e.target.value)}
                          className="text-xs px-3 py-2 rounded-lg border-2 font-bold"
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
                      <td className="px-4 py-4 text-xs font-medium" style={{ color: "#64748B" }}>
                        {formatDate(nom.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        {nom.approved && (
                          <span
                            className="text-xs px-3 py-1 rounded-lg font-bold"
                            style={{ background: "#D1FAE5", color: "#065F46", border: "1px solid #10B981" }}
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
