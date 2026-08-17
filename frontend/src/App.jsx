import React, { useState, useEffect } from "react";
import API from "./api";
import UserRegistrationModal from "./components/UserRegistrationModal";
import {
  Ticket,
  LogOut,
  UserPlus,
  Building2,
  Shield,
  User,
} from "lucide-react";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  useEffect(() => {
    if (token) {
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await API.post("/auth/login", loginData);
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      API.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete API.defaults.headers.common["Authorization"];
    setToken("");
    setUser(null);
  };

  // 1. UNAUTHENTICATED VIEW: Fullscreen Login
  if (!token || !user) {
    return (
      <div className="w-full min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <Ticket className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">IT Helpdesk</h1>
              <p className="text-xs text-slate-500">
                Multi-BU Ticketing Portal
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Username / Staff ID
              </label>
              <input
                type="text"
                required
                value={loginData.username}
                onChange={(e) =>
                  setLoginData({ ...loginData, username: e.target.value })
                }
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="e.g. admin or hotel_agent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 shadow-md shadow-blue-500/20"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED VIEW: Fullscreen Dashboard & Navbar Layout
  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Edge-to-Edge Navigation Bar */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              IT Ticketing Portal
            </h1>
            <p className="text-xs text-slate-400">
              Unit:{" "}
              <span className="text-slate-200">
                {user.businessUnit?.name || "Global"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 font-medium text-sm text-slate-200">
              <User className="w-4 h-4 text-blue-400" />
              {user.fullName}
            </div>
            <span className="inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {user.role}
            </span>
          </div>

          {user.role === "ADMIN" && (
            <button
              onClick={() => setIsRegModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Dashboard Workspace spanning full width container */}
      <main className="w-full flex-1 max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Welcome to {user.businessUnit?.name || "Global IT"} Portal
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">
            Authentication and Business Unit access controls are active. Ready
            to build Phase 5: Ticket creation, routing queues, and agent status
            tracking!
          </p>
        </div>
      </main>

      {/* Registration Modal for Admins */}
      <UserRegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
      />
    </div>
  );
}
