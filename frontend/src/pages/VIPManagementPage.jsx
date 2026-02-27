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
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#F5EFE7", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
          إدارة عملاء VIP
        </h2>
        <p className="text-sm" style={{ color: "#E8DCC8", textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
          رفع وإدارة بيانات عملاء VIP من خلال ملفات Excel أو إضافة يدوية
        </p>
      </div>

      {/* VIP List Section */}
      <div className="mb-6 p-6 rounded-xl" style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold" style={{ color: "#2C2416" }}>
            قائمة عملاء VIP ({pagination.totalCount})
          </h3>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)",
              color: "#FFF",
              boxShadow: "0 4px 12px rgba(228,183,122,0.3)",
            }}
          >
            + إضافة عميل جديد
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="ابحث بالاسم أو الجوال أو البريد الإلكتروني..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg text-sm"
            style={{
              border: "2px solid rgba(196,149,90,0.3)",
              background: "rgba(255,255,255,0.9)",
              color: "#2C2416",
            }}
          />
          <button
            type="submit"
            className="px-6 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "rgba(196,149,90,0.2)",
              border: "1px solid rgba(196,149,90,0.3)",
              color: "#A8803F",
            }}
          >
            بحث
          </button>
        </form>

        {/* Table */}
        {loading ? (
          <div className="text-center py-8" style={{ color: "#7A6550" }}>
            جارٍ التحميل...
          </div>
        ) : vipList.length === 0 ? (
          <div className="text-center py-8" style={{ color: "#7A6550" }}>
            لا توجد بيانات عملاء VIP
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
                <thead>
                  <tr>
                    <th className="text-right px-4 py-2 text-sm font-semibold" style={{ color: "#7A6550" }}>
                      الاسم
                    </th>
                    <th className="text-right px-4 py-2 text-sm font-semibold" style={{ color: "#7A6550" }}>
                      الجوال
                    </th>
                    <th className="text-right px-4 py-2 text-sm font-semibold" style={{ color: "#7A6550" }}>
                      البريد الإلكتروني
                    </th>
                    <th className="text-right px-4 py-2 text-sm font-semibold" style={{ color: "#7A6550" }}>
                      عدد الحجوزات
                    </th>
                    <th className="text-center px-4 py-2 text-sm font-semibold" style={{ color: "#7A6550" }}>
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vipList.map((vip) => (
                    <tr
                      key={vip.id}
                      className="rounded-lg"
                      style={{
                        background: "rgba(245,239,231,0.5)",
                        borderBottom: "1px solid rgba(196,149,90,0.1)",
                      }}
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: "#2C2416" }}>
                        {vip.full_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "#2C2416" }}>
                        {vip.phone}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#2C2416" }}>
                        {vip.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#2C2416" }}>
                        {vip.bookings_count || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openEditModal(vip)}
                          className="ml-2 px-3 py-1 rounded text-xs transition-all"
                          style={{
                            background: "rgba(33,150,243,0.1)",
                            border: "1px solid rgba(33,150,243,0.3)",
                            color: "#1976D2",
                          }}
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(vip)}
                          className="px-3 py-1 rounded text-xs transition-all"
                          style={{
                            background: "rgba(239,83,80,0.1)",
                            border: "1px solid rgba(239,83,80,0.3)",
                            color: "#C62828",
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
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "rgba(196,149,90,0.2)",
                    border: "1px solid rgba(196,149,90,0.3)",
                    color: "#A8803F",
                  }}
                >
                  السابق
                </button>
                <span className="text-sm" style={{ color: "#7A6550" }}>
                  صفحة {pagination.currentPage} من {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "rgba(196,149,90,0.2)",
                    border: "1px solid rgba(196,149,90,0.3)",
                    color: "#A8803F",
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
      <div className="mb-6 p-6 rounded-xl" style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#2C2416" }}>
          رفع ملف Excel
        </h3>

        {/* Instructions */}
        <div className="mb-6 p-4 rounded-lg" style={{ background: "rgba(228,183,122,0.1)", border: "1px solid rgba(196,149,90,0.3)" }}>
          <h4 className="font-semibold mb-2" style={{ color: "#A8803F" }}>
            تعليمات:
          </h4>
          <ul className="text-sm space-y-1" style={{ color: "#7A6550" }}>
            <li>• يجب أن يحتوي الملف على الأعمدة التالية: <strong>الاسم</strong> أو <strong>Name</strong>، <strong>الجوال</strong> أو <strong>Phone</strong></li>
            <li>• عمود <strong>البريد الإلكتروني</strong> أو <strong>Email</strong> اختياري</li>
            <li>• رقم الجوال مطلوب ويجب أن يبدأ بـ 05 ويتكون من 10 أرقام</li>
            <li>• الصف الأول يجب أن يحتوي على أسماء الأعمدة</li>
            <li>• الصفوف الفارغة سيتم تجاهلها</li>
          </ul>
          <button
            onClick={downloadTemplate}
            className="mt-3 text-sm px-4 py-2 rounded-lg transition-all"
            style={{
              background: "rgba(196,149,90,0.2)",
              border: "1px solid rgba(196,149,90,0.3)",
              color: "#A8803F",
            }}
          >
            تحميل نموذج Excel
          </button>
        </div>

        {/* File Input */}
        <div className="mb-4">
          <label className="block text-sm mb-2 font-medium" style={{ color: "#7A6550" }}>
            اختر ملف Excel
          </label>
          <input
            id="excel-file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm"
            style={{
              padding: "12px",
              border: "2px solid rgba(196,149,90,0.3)",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.9)",
              color: "#2C2416",
            }}
          />
          {selectedFile && (
            <p className="mt-2 text-sm" style={{ color: "#7A6550" }}>
              الملف المحدد: <strong>{selectedFile.name}</strong>
            </p>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="px-6 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: selectedFile && !uploading ? "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)" : "rgba(196,149,90,0.3)",
            color: "#FFF",
            boxShadow: selectedFile && !uploading ? "0 4px 12px rgba(228,183,122,0.3)" : "none",
          }}
        >
          {uploading ? "جارٍ الرفع..." : "رفع الملف"}
        </button>
      </div>

      {/* Results Section */}
      {uploadResult && (
        <div
          className="p-6 rounded-xl"
          style={{
            background: uploadResult.success ? "rgba(102,187,106,0.1)" : "rgba(239,83,80,0.1)",
            border: `2px solid ${uploadResult.success ? "rgba(102,187,106,0.3)" : "rgba(239,83,80,0.3)"}`,
          }}
        >
          <h3
            className="text-lg font-bold mb-4"
            style={{ color: uploadResult.success ? "#2E7D32" : "#C62828" }}
          >
            {uploadResult.success ? "✓ نجحت العملية" : "✗ فشلت العملية"}
          </h3>

          <p className="mb-4" style={{ color: "#2C2416" }}>
            {uploadResult.message}
          </p>

          {uploadResult.success && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-lg" style={{ background: "rgba(102,187,106,0.15)" }}>
                <div className="text-2xl font-bold" style={{ color: "#2E7D32" }}>
                  {uploadResult.created}
                </div>
                <div className="text-sm" style={{ color: "#7A6550" }}>
                  عميل جديد
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(255,183,77,0.15)" }}>
                <div className="text-2xl font-bold" style={{ color: "#E65100" }}>
                  {uploadResult.updated}
                </div>
                <div className="text-sm" style={{ color: "#7A6550" }}>
                  عميل محدث
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(158,158,158,0.15)" }}>
                <div className="text-2xl font-bold" style={{ color: "#616161" }}>
                  {uploadResult.skipped}
                </div>
                <div className="text-sm" style={{ color: "#7A6550" }}>
                  تم تخطيه
                </div>
              </div>
            </div>
          )}

          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2" style={{ color: "#C62828" }}>
                الأخطاء ({uploadResult.total_errors}):
              </h4>
              <ul className="text-sm space-y-1" style={{ color: "#7A6550" }}>
                {uploadResult.errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
                {uploadResult.total_errors > uploadResult.errors.length && (
                  <li className="font-semibold">
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
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1000 }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md p-6 rounded-xl"
            style={{ background: "#FFF", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: "#2C2416" }}>
              {editingVip ? "تعديل عميل VIP" : "إضافة عميل VIP جديد"}
            </h3>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm mb-2 font-medium" style={{ color: "#7A6550" }}>
                الاسم (اختياري)
              </label>
              <input
                type="text"
                value={modalData.full_name}
                onChange={(e) => setModalData({ ...modalData, full_name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg text-sm"
                placeholder="محمد أحمد"
                style={{
                  border: "2px solid rgba(196,149,90,0.3)",
                  background: "rgba(255,255,255,0.9)",
                  color: "#2C2416",
                }}
              />
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-sm mb-2 font-medium" style={{ color: "#7A6550" }}>
                الجوال <span style={{ color: "#C62828" }}>*</span>
              </label>
              <input
                type="text"
                value={modalData.phone}
                onChange={(e) => setModalData({ ...modalData, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg text-sm"
                placeholder="0501234567"
                disabled={!!editingVip}
                style={{
                  border: "2px solid rgba(196,149,90,0.3)",
                  background: editingVip ? "rgba(200,200,200,0.3)" : "rgba(255,255,255,0.9)",
                  color: "#2C2416",
                }}
              />
              {editingVip && (
                <p className="text-xs mt-1" style={{ color: "#7A6550" }}>
                  لا يمكن تعديل رقم الجوال
                </p>
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm mb-2 font-medium" style={{ color: "#7A6550" }}>
                البريد الإلكتروني (اختياري)
              </label>
              <input
                type="email"
                value={modalData.email}
                onChange={(e) => setModalData({ ...modalData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg text-sm"
                placeholder="example@email.com"
                style={{
                  border: "2px solid rgba(196,149,90,0.3)",
                  background: "rgba(255,255,255,0.9)",
                  color: "#2C2416",
                }}
              />
            </div>

            {/* Error */}
            {modalError && (
              <div
                className="mb-4 px-4 py-3 rounded-lg text-sm"
                style={{
                  background: "rgba(239,83,80,0.1)",
                  border: "1px solid rgba(239,83,80,0.3)",
                  color: "#C62828",
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
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #E4B77A 0%, #C4955A 100%)",
                  color: "#FFF",
                  boxShadow: "0 4px 12px rgba(228,183,122,0.3)",
                }}
              >
                {modalSaving ? "جارٍ الحفظ..." : "حفظ"}
              </button>
              <button
                onClick={closeModal}
                disabled={modalSaving}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: "rgba(196,149,90,0.2)",
                  border: "1px solid rgba(196,149,90,0.3)",
                  color: "#A8803F",
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
}
