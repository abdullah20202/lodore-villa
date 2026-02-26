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
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const managementUsername = localStorage.getItem("management_username");
    if (!managementUsername) {
      navigate("/management/login", { replace: true });
      return;
    }
    setUsername(managementUsername);
  }, [navigate]);

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
        // Reset file input
        document.getElementById('excel-file-input').value = '';
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
    // Create a sample Excel template
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
          رفع وإدارة بيانات عملاء VIP من خلال ملفات Excel
        </p>
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
    </ManagementLayout>
  );
}
