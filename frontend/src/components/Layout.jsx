import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  async function loadNotifications() {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      setNotificationLoading(true);

      const response = await api.get("/notifications");

      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setNotificationLoading(false);
    }
  }
  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  useEffect(() => {
    loadNotifications();
  }, [user]);

  async function markNotificationAsRead(notificationId) {
    try {
      await api.patch(`/notifications/${notificationId}/read`);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }

  async function markAllNotificationsAsRead() {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }

  async function handleNotificationClick(notification) {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }

    setNotificationOpen(false);

    if (notification.application_id) {
      navigate(`/applications/${notification.application_id}`);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      label: "Applications",
      path: "/applications",
    },
    {
      label: "Application Board",
      path: "/applications/board",
    },
    {
      label: "Analytics",
      path: "/analytics",
    },
    {
      label: "Resumes",
      path: "/resumes",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col">
        <div className="border-b border-slate-800 px-6 py-5">
          <h1 className="text-xl font-bold">
            Job Tracker
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Stay organized. Get hired.
          </p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <p className="truncate px-2 text-sm text-slate-400">
            {user?.email}
          </p>

          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="lg:hidden">
              <h1 className="font-bold">Job Tracker</h1>
            </div>

            <div className="ml-auto flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationOpen((current) => !current)}
                  className="relative rounded-lg p-2 text-slate-400 transition hover:bg-slate-900 hover:text-white"
                  aria-label="Notifications"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.967 8.967 0 0 1-2.31 6.022c1.71.6 3.53 1.05 5.453 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                    />
                  </svg>

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                      <div>
                        <h2 className="text-sm font-semibold text-white">
                          Notifications
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {unreadCount} unread
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsAsRead}
                          className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[28rem] overflow-y-auto">
                      {notificationLoading ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">
                          Loading notifications...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm text-slate-400">
                            No notifications
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            You're all caught up.
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full border-b border-slate-800 px-4 py-3 text-left transition hover:bg-slate-800 ${
                              notification.is_read
                                ? "bg-slate-900"
                                : "bg-slate-800/70"
                            }`}
                          >
                            <div className="flex gap-3">
                              <div
                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                  notification.is_read
                                    ? "bg-slate-600"
                                    : "bg-blue-400"
                                }`}
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p
                                    className={`text-sm ${
                                      notification.is_read
                                        ? "font-medium text-slate-400"
                                        : "font-semibold text-white"
                                    }`}
                                  >
                                    {notification.title}
                                  </p>

                                  {!notification.is_read && (
                                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-blue-400">
                                      New
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-xs leading-5 text-slate-400">
                                  {notification.message}
                                </p>

                                <p className="mt-2 text-[10px] text-slate-600">
                                  {new Date(
                                    notification.created_at
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden text-sm text-slate-400 sm:block">
                {user?.email}
              </div>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

export default Layout;