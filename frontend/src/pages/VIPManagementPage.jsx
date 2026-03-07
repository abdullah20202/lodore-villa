/**
 * /management/vip — VIP Customers Management Page
 * Upload and manage VIP customer data
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearTokens } from "../api/client";
import ManagementLayout from "../components/ManagementLayout";

export default function VIPManagementPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  // Excel upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // VIP list state
  const [vipList, setVipList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });

  // Add/Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingVip, setEditingVip] = useState(null);
  const [modalData, setModalData] = useState({
    full_name: "",
    phone: "",
    email: "",
  });
  const [modalError, setModalError] = useState("");
  const [modalSaving, setModalSaving] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const managementUsername = localStorage.getItem("management_username");
    if (!managementUsername) {
      navigate("/management/login", { replace: true });
      return;
    }
    setUsername(managementUsername);

    // Load VIP list on mount
    loadVIPList(1, "");
  }, [navigate]);

  const loadVIPList = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "10",
      });
      if (search) {
        params.append("search", search);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/management/vip/list?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.ok) {
        setVipList(data.results);
        setPagination({
          currentPage: page,
          totalPages: data.total_pages,
          totalCount: data.count,
        });
      } else {
        console.error('Failed to load VIP list:', data.message);
      }
    } catch (error) {
      console.error('Error loading VIP list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadVIPList(1, searchQuery);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (value === "") {
      loadVIPList(1, "");
    }
  };

  const handlePageChange = (newPage) => {
    loadVIPList(newPage, searchQuery);
  };

  const openAddModal = () => {
    setEditingVip(null);
    setModalData({ full_name: "", phone: "", email: "" });
    setModalError("");
    setShowModal(true);
  };

  const openEditModal = (vip) => {
    setEditingVip(vip);
    setModalData({
      full_name: vip.full_name || "",
      phone: vip.phone || "",
      email: vip.email || "",
    });
    setModalError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVip(null);
    setModalData({ full_name: "", phone: "", email: "" });
    setModalError("");
  };

  const handleModalSave = async () => {
    setModalError("");

    // Validation
    if (!modalData.phone || !modalData.phone.trim()) {
      setModalError("رقم الجوال مطلوب");
      return;
    }

    setModalSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/management/vip/manage`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(modalData),
        }
      );

      const data = await response.json();

      if (response.ok && data.ok) {
        closeModal();
        loadVIPList(pagination.currentPage, searchQuery);
        alert(editingVip ? "تم تحديث العميل بنجاح" : "تم إضافة العميل بنجاح");
      } else {
        setModalError(data.message || "حدث خطأ أثناء الحفظ");
      }
    } catch (error) {
      console.error('Error saving VIP:', error);
      setModalError("حدث خطأ أثناء الحفظ");
    } finally {
      setModalSaving(false);
    }
  };

  const handleDelete = async (vip) => {
    if (!confirm(`هل أنت متأكد من حذف العميل ${vip.full_name || vip.phone}؟`)) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/management/vip/${vip.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.ok) {
        loadVIPList(pagination.currentPage, searchQuery);
        alert("تم حذف العميل بنجاح");
      } else {
        alert(data.message || "فشل حذف العميل");
      }
    } catch (error) {
      console.error('Error deleting VIP:', error);
      alert("حدث خطأ أثناء حذف العميل");
    }
  };

  // Excel upload functions
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("يرجى اختيار ملف Excel");
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/management/vip/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok && data.ok) {
        setUploadResult({
          success: true,
          message: data.message,
          created: data.created,
          updated: data.updated,
          skipped: data.skipped,
          errors: data.errors || [],
          total_errors: data.total_errors || 0,
        });
        setSelectedFile(null);
        document.getElementById('excel-file-input').value = '';
        // Reload VIP list after successful upload
        loadVIPList(pagination.currentPage, searchQuery);
      } else {
        setUploadResult({
          success: false,
          message: data.message || "فشل رفع الملف",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: "حدث خطأ أثناء رفع الملف",
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "الاسم,الجوال,البريد الإلكتروني\nمحمد أحمد,0501234567,mohamed@example.com\nفاطمة علي,0509876543,fatima@example.com";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vip_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <ManagementLayout username={username}>
      <div className="p-8 max-w-7xl mx-auto" style={{ background: "#F8FAFC", minHeight: "100vh" }}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: "#1E293B" }}>
            إدارة عملاء VIP
          </h1>
          <p className="text-lg font-medium" style={{ color: "#64748B" }}>
            رفع وإدارة بيانات عملاء VIP من خلال ملفات Excel أو إضافة يدوية
          </p>
        </div>

        {/* VIP List Section */}
        <div className="mb-6 p-6 rounded-xl shadow-lg" style={{ background: "#FFFFFF", border: "2px solid #E2E8F0" }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
              قائمة عملاء VIP ({pagination.totalCount})
            </h2>
            <button
              onClick={openAddModal}
              className="px-6 py-3 rounded-lg text-sm font-bold transition-all shadow-lg"
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "#FFF",
                border: "2px solid #10B981",
              }}
            >
              + إضافة عميل جديد
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6 flex gap-3">
            <input
              type="text"
              placeholder="ابحث بالاسم أو الجوال أو البريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg font-medium"
              style={{
                border: "2px solid #E2E8F0",
                background: "#FFFFFF",
                color: "#1E293B",
              }}
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-lg text-sm font-bold transition-all shadow-lg"
              style={{
                background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                border: "2px solid #3B82F6",
                color: "#FFF",
              }}
            >
              بحث
            </button>
          </form>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">
              <div
                className="w-16 h-16 mx-auto rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: "#3B82F6", borderTopColor: "transparent" }}
              />
              <p className="mt-4 font-semibold" style={{ color: "#334155" }}>
                جارٍ التحميل...
              </p>
            </div>
          ) : vipList.length === 0 ? (
            <div className="text-center py-12 rounded-xl" style={{ background: "#F1F5F9" }}>
              <p className="font-bold text-lg" style={{ color: "#64748B" }}>لا توجد بيانات عملاء VIP</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl" style={{ border: "2px solid #E2E8F0" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E2E8F0", background: "#F1F5F9" }}>
                      <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                        الاسم
                      </th>
                      <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                        الجوال
                      </th>
                      <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                        البريد الإلكتروني
                      </th>
                      <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                        عدد الحجوزات
                      </th>
                      <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vipList.map((vip) => (
                      <tr
                        key={vip.id}
                        style={{
                          borderBottom: "1px solid #E2E8F0",
                        }}
                      >
                        <td className="px-4 py-4 text-sm font-bold" style={{ color: "#1E293B" }}>
                          {vip.full_name || "-"}
                        </td>
                        <td className="px-4 py-4 text-sm font-mono font-bold" style={{ color: "#1E293B" }}>
                          {vip.phone}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium" style={{ color: "#64748B" }}>
                          {vip.email || "-"}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold" style={{ color: "#2563EB" }}>
                          {vip.bookings_count || 0}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => openEditModal(vip)}
                            className="ml-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow"
                            style={{
                              background: "#DBEAFE",
                              border: "2px solid #3B82F6",
                              color: "#1D4ED8",
                            }}
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDelete(vip)}
                            className="px-4 py-2 rounded-lg text-xs font-bold transition-all shadow"
                            style={{
                              background: "#FEE2E2",
                              border: "2px solid #EF4444",
                              color: "#DC2626",
                            }}
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-6">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-6 py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    style={{
                      background: "#FFFFFF",
                      border: "2px solid #3B82F6",
                      color: "#2563EB",
                    }}
                  >
                    السابق
                  </button>
                  <span className="text-sm px-4 font-bold" style={{ color: "#334155" }}>
                    صفحة {pagination.currentPage} من {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-6 py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    style={{
                      background: "#FFFFFF",
                      border: "2px solid #3B82F6",
                      color: "#2563EB",
                    }}
                  >
                    التالي
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Upload Section */}
        <div className="mb-6 p-6 rounded-xl shadow-lg" style={{ background: "#FFFFFF", border: "2px solid #E2E8F0" }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#1E293B" }}>
            رفع ملف Excel
          </h2>

          {/* Instructions */}
          <div className="mb-6 p-6 rounded-lg shadow" style={{ background: "#EFF6FF", border: "2px solid #DBEAFE" }}>
            <h3 className="font-bold mb-3 text-lg" style={{ color: "#1D4ED8" }}>
              تعليمات:
            </h3>
            <ul className="text-sm space-y-2 font-medium" style={{ color: "#334155" }}>
              <li>• يجب أن يحتوي الملف على الأعمدة التالية: <strong>الاسم</strong> أو <strong>Name</strong>، <strong>الجوال</strong> أو <strong>Phone</strong></li>
              <li>• عمود <strong>البريد الإلكتروني</strong> أو <strong>Email</strong> اختياري</li>
              <li>• رقم الجوال مطلوب ويجب أن يبدأ بـ 05 ويتكون من 10 أرقام</li>
              <li>• الصف الأول يجب أن يحتوي على أسماء الأعمدة</li>
              <li>• الصفوف الفارغة سيتم تجاهلها</li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="mt-4 text-sm px-5 py-2.5 rounded-lg font-bold transition-all shadow"
              style={{
                background: "#DBEAFE",
                border: "2px solid #3B82F6",
                color: "#1D4ED8",
              }}
            >
              📥 تحميل نموذج Excel
            </button>
          </div>

          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm mb-3 font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
              اختر ملف Excel
            </label>
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm font-medium"
              style={{
                padding: "16px",
                border: "2px solid #E2E8F0",
                borderRadius: "12px",
                background: "#FFFFFF",
                color: "#1E293B",
              }}
            />
            {selectedFile && (
              <p className="mt-3 text-sm font-bold" style={{ color: "#059669" }}>
                ✓ الملف المحدد: <strong>{selectedFile.name}</strong>
              </p>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-8 py-4 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            style={{
              background: selectedFile && !uploading ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" : "#CBD5E1",
              color: "#FFF",
              border: selectedFile && !uploading ? "2px solid #10B981" : "2px solid #94A3B8",
            }}
          >
            {uploading ? "جارٍ الرفع..." : "📤 رفع الملف"}
          </button>
        </div>

        {/* Results Section */}
        {uploadResult && (
          <div
            className="p-6 rounded-xl shadow-lg"
            style={{
              background: uploadResult.success ? "#ECFDF5" : "#FEF2F2",
              border: `2px solid ${uploadResult.success ? "#10B981" : "#EF4444"}`,
            }}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: uploadResult.success ? "#065F46" : "#991B1B" }}
            >
              {uploadResult.success ? "✓ نجحت العملية" : "✗ فشلت العملية"}
            </h2>

            <p className="mb-6 font-medium text-lg" style={{ color: "#1E293B" }}>
              {uploadResult.message}
            </p>

            {uploadResult.success && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-5 rounded-xl shadow" style={{ background: "#D1FAE5", border: "2px solid #10B981" }}>
                  <div className="text-4xl font-bold mb-2" style={{ color: "#065F46" }}>
                    {uploadResult.created}
                  </div>
                  <div className="text-sm font-bold uppercase tracking-wide" style={{ color: "#059669" }}>
                    عميل جديد
                  </div>
                </div>
                <div className="p-5 rounded-xl shadow" style={{ background: "#FEF3C7", border: "2px solid #F59E0B" }}>
                  <div className="text-4xl font-bold mb-2" style={{ color: "#92400E" }}>
                    {uploadResult.updated}
                  </div>
                  <div className="text-sm font-bold uppercase tracking-wide" style={{ color: "#D97706" }}>
                    عميل محدث
                  </div>
                </div>
                <div className="p-5 rounded-xl shadow" style={{ background: "#F1F5F9", border: "2px solid #94A3B8" }}>
                  <div className="text-4xl font-bold mb-2" style={{ color: "#334155" }}>
                    {uploadResult.skipped}
                  </div>
                  <div className="text-sm font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>
                    تم تخطيه
                  </div>
                </div>
              </div>
            )}

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="mt-6 p-4 rounded-lg" style={{ background: "#FEE2E2", border: "2px solid #EF4444" }}>
                <h3 className="font-bold mb-3 text-lg" style={{ color: "#991B1B" }}>
                  الأخطاء ({uploadResult.total_errors}):
                </h3>
                <ul className="text-sm space-y-2 font-medium" style={{ color: "#DC2626" }}>
                  {uploadResult.errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                  {uploadResult.total_errors > uploadResult.errors.length && (
                    <li className="font-bold">
                      ... و {uploadResult.total_errors - uploadResult.errors.length} أخطاء أخرى
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", zIndex: 1000 }}
            onClick={closeModal}
          >
            <div
              className="w-full max-w-md p-8 rounded-2xl shadow-2xl"
              style={{ background: "#FFF", border: "2px solid #E2E8F0" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6" style={{ color: "#1E293B" }}>
                {editingVip ? "تعديل عميل VIP" : "إضافة عميل VIP جديد"}
              </h2>

              {/* Name */}
              <div className="mb-5">
                <label className="block text-sm mb-2 font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                  الاسم (اختياري)
                </label>
                <input
                  type="text"
                  value={modalData.full_name}
                  onChange={(e) => setModalData({ ...modalData, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg font-medium"
                  placeholder="محمد أحمد"
                  style={{
                    border: "2px solid #E2E8F0",
                    background: "#FFFFFF",
                    color: "#1E293B",
                  }}
                />
              </div>

              {/* Phone */}
              <div className="mb-5">
                <label className="block text-sm mb-2 font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                  الجوال <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={modalData.phone}
                  onChange={(e) => setModalData({ ...modalData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg font-medium"
                  placeholder="0501234567"
                  disabled={!!editingVip}
                  style={{
                    border: "2px solid #E2E8F0",
                    background: editingVip ? "#F1F5F9" : "#FFFFFF",
                    color: "#1E293B",
                  }}
                />
                {editingVip && (
                  <p className="text-xs mt-2 font-medium" style={{ color: "#64748B" }}>
                    لا يمكن تعديل رقم الجوال
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="mb-6">
                <label className="block text-sm mb-2 font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                  البريد الإلكتروني (اختياري)
                </label>
                <input
                  type="email"
                  value={modalData.email}
                  onChange={(e) => setModalData({ ...modalData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg font-medium"
                  placeholder="example@email.com"
                  style={{
                    border: "2px solid #E2E8F0",
                    background: "#FFFFFF",
                    color: "#1E293B",
                  }}
                />
              </div>

              {/* Error */}
              {modalError && (
                <div
                  className="mb-6 px-4 py-3 rounded-lg text-sm font-bold"
                  style={{
                    background: "#FEE2E2",
                    border: "2px solid #EF4444",
                    color: "#DC2626",
                  }}
                >
                  {modalError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleModalSave}
                  disabled={modalSaving}
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    color: "#FFF",
                    border: "2px solid #10B981",
                  }}
                >
                  {modalSaving ? "جارٍ الحفظ..." : "💾 حفظ"}
                </button>
                <button
                  onClick={closeModal}
                  disabled={modalSaving}
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all shadow-lg"
                  style={{
                    background: "#F1F5F9",
                    border: "2px solid #E2E8F0",
                    color: "#64748B",
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
}
