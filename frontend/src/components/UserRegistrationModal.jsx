import { useState, useEffect } from "react";
import API from "../api";
import { UserPlus, Copy, Check, X } from "lucide-react";

export default function UserRegistrationModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    businessUnitId: "",
    departmentId: "",
    role: "USER",
  });

  const [businessUnits, setBusinessUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchMetadata = async () => {
      try {
        const res = await API.get("/metadata");

        setBusinessUnits(res.data.businessUnits || []);
        setDepartments(res.data.departments || []);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            "Failed to load business units and departments",
        );
      }
    };

    fetchMetadata();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredDepartments = departments.filter(
    (d) => d.business_unit_id === parseInt(formData.businessUnitId, 10),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/users/create", formData);

      setReceipt(res.data.credentials);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to register user");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!receipt) return;

    const text = `Name: ${receipt.fullName}
Username: ${receipt.username}
Temp Password: ${receipt.tempPassword}`;

    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Failed to copy credentials");
    }
  };

  const resetAndClose = () => {
    setReceipt(null);
    setError("");
    setCopied(false);
    setFormData({
      fullName: "",
      username: "",
      businessUnitId: "",
      departmentId: "",
      role: "USER",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Register New User
            </h2>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!receipt ? (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Error */}
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Full Name
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fullName: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Username / Staff ID
                </label>

                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      username: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. hotel_john"
                  required
                />
              </div>

              {/* Business Unit + Department */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Business Unit */}
                <div>
                  <label
                    htmlFor="businessUnit"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Business Unit
                  </label>

                  <select
                    id="businessUnit"
                    value={formData.businessUnitId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        businessUnitId: e.target.value,
                        departmentId: "",
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select BU...</option>

                    {businessUnits.map((bu) => (
                      <option key={bu.id} value={bu.id}>
                        {bu.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label
                    htmlFor="department"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Department
                  </label>

                  <select
                    id="department"
                    value={formData.departmentId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departmentId: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    disabled={!formData.businessUnitId}
                    required
                  >
                    <option value="">Select Dept...</option>

                    {filteredDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* System Role */}
              <div>
                <label
                  htmlFor="role"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  System Role
                </label>

                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="USER">USER (Staff)</option>
                  <option value="AGENT">AGENT (IT Support)</option>
                  <option value="ADMIN">ADMIN (IT Admin)</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={resetAndClose}
                disabled={loading}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating..." : "Generate Credentials"}
              </button>
            </div>
          </form>
        ) : (
          /* Success Receipt */
          <div className="p-6">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <Check className="h-7 w-7 text-green-600" />
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                User Created Successfully!
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Hand these credentials to the staff member:
              </p>
            </div>

            {/* Credentials */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Credential Summary
              </p>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-slate-500">Name:</span>{" "}
                  <span className="font-semibold text-slate-900">
                    {receipt.fullName}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-slate-500">Username:</span>{" "}
                  <span className="font-semibold text-slate-900">
                    {receipt.username}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-slate-500">
                    Temp Password:
                  </span>{" "}
                  <span className="font-mono font-semibold text-slate-900">
                    {receipt.tempPassword}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}

                {copied ? "Copied!" : "Copy Info"}
              </button>

              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
