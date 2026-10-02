"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/services/api";
import {
  Network,
  FileText,
  Layers,
  Cpu,
  LayoutTemplate,
  Smartphone,
  Database,
  Briefcase,
  Users,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  ShieldCog,
  ShieldCheck,
  Laptop,
  Box,
  CalendarCheck,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useSidebarStore } from "@/store/useSidebarStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, isOpenMobile, toggleCollapsed, setOpenMobile, initStore } = useSidebarStore();
  const { currentUser, loadCurrentUser } = useTaskStore();

  const { fetchProfile, user, bidang, services, isAdminAptika, hasServicePermission } = useAuthStore();
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      try {
        const uStr = localStorage.getItem("user");
        if (uStr) {
          const uObj = JSON.parse(uStr);
          if (uObj?.role === "admin") {
            setHasAdminRole(true);
          }
        }
      } catch {}
    }
  }, []);

  const hasAdminAccess = isAdminAptika || user?.role === "admin" || hasAdminRole;

  const [userName, setUserName] = useState("User");

  const activeSegment = pathname.split("/")[1] || "dashboard";

  const appGroupKeys = [
    "integrasiinteroperabilitas",
    "pengelolaanaplikasi",
    "rekayasaaplikasi",
    "sidebarjabar",
    "smartjabar",
    "sadajabar",
  ];
  const isAppGroupActive = appGroupKeys.includes(activeSegment);
  const [isAppGroupOpen, setIsAppGroupOpen] = useState(isAppGroupActive);

  const isSmkiActive = activeSegment === "smki" || activeSegment === "daftar-aset-ti";
  const [isSmkiGroupOpen, setIsSmkiGroupOpen] = useState(isSmkiActive);

  useEffect(() => {
    loadCurrentUser();
    fetchProfile();
  }, [loadCurrentUser, fetchProfile]);

  useEffect(() => {
    if (isAppGroupActive) {
      setIsAppGroupOpen(true);
    }
  }, [isAppGroupActive]);

  useEffect(() => {
    if (isSmkiActive) {
      setIsSmkiGroupOpen(true);
    }
  }, [isSmkiActive]);

  useEffect(() => {
    initStore();
    if (typeof window !== "undefined") {
      try {
        const uStr = localStorage.getItem("user");
        if (uStr) {
          const uObj = JSON.parse(uStr);
          setUserName(uObj?.name || "User");
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [initStore]);

  // Dynamic Navigation Items Evaluation (guarded by isMounted to prevent SSR/Hydration mismatch)
  const canAccessSurat = isMounted && hasServicePermission("ADMINISTRASI_SURAT");
  const canAccessIki = isMounted && hasServicePermission("IKI_REPORT");
  const canAccessTugas = isMounted && hasServicePermission("MANAJEMEN_TUGAS");
  const canAccessMagang = isMounted && hasServicePermission("MAGANG");
  const canAccessSmki = isMounted && hasServicePermission("SMKI");

  const dynamicMenuItems = [
    ...(canAccessSurat
      ? [
          {
            type: "single" as const,
            name: "Administrasi Surat",
            key: "administrasisurat",
            icon: FileText,
            iconColor: "text-amber-600 bg-amber-50 border border-amber-200/60",
          },
        ]
      : []),
    ...(canAccessIki
      ? [
          {
            type: "group" as const,
            name: "IKI Report",
            icon: Layers,
            iconColor: "text-purple-600 bg-purple-50 border border-purple-200/60",
            subItems: [
              ...(hasServicePermission("IKI_INTEGRASI")
                ? [
                    {
                      name: "Integrasi Interoperabilitas",
                      key: "integrasiinteroperabilitas",
                      icon: Network,
                      iconColor: "text-blue-600 bg-blue-50 border border-blue-200/60",
                    },
                  ]
                : []),
              ...(hasServicePermission("IKI_PENGELOLAAN")
                ? [
                    {
                      name: "Pengelolaan Aplikasi",
                      key: "pengelolaanaplikasi",
                      icon: Layers,
                      iconColor: "text-purple-600 bg-purple-50 border border-purple-200/60",
                    },
                  ]
                : []),
              ...(hasServicePermission("IKI_REKAYASA")
                ? [
                    {
                      name: "Rekayasa Aplikasi",
                      key: "rekayasaaplikasi",
                      icon: Cpu,
                      iconColor: "text-cyan-600 bg-cyan-50 border border-cyan-200/60",
                    },
                  ]
                : []),
              ...(hasServicePermission("IKI_SIDEBAR")
                ? [
                    {
                      name: "Sidebar Jabar",
                      key: "sidebarjabar",
                      icon: LayoutTemplate,
                      iconColor: "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
                    },
                  ]
                : []),
              ...(hasServicePermission("IKI_SMARTJABAR")
                ? [
                    {
                      name: "Smart Jabar",
                      key: "smartjabar",
                      icon: Smartphone,
                      iconColor: "text-violet-600 bg-violet-50 border border-violet-200/60",
                    },
                  ]
                : []),
              ...(hasServicePermission("IKI_SADAJABAR")
                ? [
                    {
                      name: "Sada Jabar",
                      key: "sadajabar",
                      icon: Database,
                      iconColor: "text-sky-600 bg-sky-50 border border-sky-200/60",
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
    ...(canAccessTugas
      ? [
          {
            type: "single" as const,
            name: "Manajemen Tugas Digital",
            key: "manajementugasdigital",
            icon: Briefcase,
            iconColor: "text-rose-600 bg-rose-50 border border-rose-200/60",
          },
        ]
      : []),
    ...(canAccessMagang
      ? [
          {
            type: "single" as const,
            name: "Magang",
            key: "magang",
            icon: Users,
            iconColor: "text-indigo-600 bg-indigo-50 border border-indigo-200/60",
          },
        ]
      : []),
    ...(canAccessSmki
      ? [
          {
            type: "group" as const,
            name: "SMKI",
            icon: ShieldCheck,
            iconColor: "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
            subItems: [
              {
                name: "Ringkasan SMKI",
                key: "smki",
                icon: ShieldCheck,
                iconColor: "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
              },
              {
                name: "Software Standar",
                key: "smki/software-standar",
                icon: Laptop,
                iconColor: "text-teal-600 bg-teal-50 border border-teal-200/60",
              },
              {
                name: "Daftar Aset TI",
                key: "daftar-aset-ti",
                icon: Box,
                iconColor: "text-blue-600 bg-blue-50 border border-blue-200/60",
              },
              {
                name: "Penghancuran Media",
                key: "smki/berita-acara",
                icon: FileText,
                iconColor: "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
              },
              {
                name: "Rencana Audit",
                key: "smki/rencana-audit",
                icon: CalendarCheck,
                iconColor: "text-teal-600 bg-teal-50 border border-teal-200/60",
              },
              {
                name: "Screening Karyawan",
                key: "smki/screening-karyawan",
                icon: Users,
                iconColor: "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
              },
            ],
          },
        ]
      : []),
  ];

  const handleTeamClick = (key: string) => {
    setOpenMobile(false);
    if (key === "dashboard") {
      router.push("/dashboard");
    } else if (key === "administrasisurat" || key === "manajementugasdigital" || key === "smki" || key === "daftar-aset-ti") {
      router.push(`/${key}`);
    } else if (key.includes("/")) {
      router.push(`/${key}`);
    } else {
      router.push(`/${key}/dashboard`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      useAuthStore.getState().clearAuth();
      if (typeof document !== "undefined") {
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      }
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <>
      {/* Hamburger Toggle Button for Mobile/Tablet */}
      {!isOpenMobile && (
        <button
          className="fixed top-4 left-4 z-50 flex items-center justify-center lg:hidden w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0b2146] dark:text-white shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 print:hidden"
          onClick={() => setOpenMobile(true)}
          aria-label="Toggle Menu"
        >
          <PanelLeftOpen size={20} />
        </button>
      )}

      {/* Overlay Backdrop for Mobile/Tablet */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden transition-opacity duration-200 print:hidden"
          onClick={() => setOpenMobile(false)}
        />
      )}

      {/* Sidebar Navigation - Adaptive Light/Dark Theme */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-40 flex flex-col h-screen
        bg-white text-[#0b2146] border-r border-slate-200 shadow-sm
        dark:bg-[#071733] dark:text-white dark:border-slate-800/80
        transition-all duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:flex-shrink-0
        print:hidden
        ${isCollapsed ? "w-[76px]" : "w-[260px]"}
        ${isOpenMobile ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Brand Header */}
        <div
          className={`flex flex-col border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#071733] ${
            isCollapsed ? "px-3 py-5 items-center" : "px-6 py-5"
          }`}
        >
          {isCollapsed ? (
            <button
              onClick={toggleCollapsed}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0b2146] dark:text-white transition-all animate-in fade-in duration-200"
              title="Expand Sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
          ) : (
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex items-center justify-between w-full">
                <div
                  className="cursor-pointer flex-grow animate-in fade-in duration-200"
                  onClick={() => router.push("/dashboard")}
                >
                  <h1 className="text-[15px] font-extrabold tracking-wide uppercase text-[#0b2146] dark:text-white">
                    Aptika Tools
                  </h1>
                </div>
                <button
                  onClick={toggleCollapsed}
                  className="flex p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#0b2146] dark:hover:text-white transition-all ml-2"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>

              {/* Dynamic Bidang Badge */}
              {isMounted && bidang && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  <span className="text-[10.5px] font-bold text-blue-700 dark:text-blue-300 truncate max-w-[190px]">
                    {bidang.name}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Menu List */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-7 scrollbar-hide bg-white dark:bg-[#071733]">
          {/* Services Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-4 text-[10px] font-extrabold text-slate-400 dark:text-slate-400 tracking-widest uppercase select-none">
                Layanan
              </span>
            )}
            <div className="pt-2 space-y-1">
              {isMounted && dynamicMenuItems.map((item) => {
                if (item.type === "single") {
                  const Icon = item.icon;
                  const isActive = activeSegment === item.key;
                  return (
                    <button
                      key={item.key}
                      title={isCollapsed ? item.name : undefined}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold
                        transition-all duration-150 select-none outline-none group
                        ${isCollapsed ? "justify-center px-2" : ""}
                        ${
                          isActive
                            ? "bg-blue-50/80 text-[#0b2146] font-extrabold shadow-xs border border-blue-200/70 dark:bg-[#1d4ed8] dark:text-white dark:border-blue-500/50 dark:shadow-blue-500/20"
                            : "text-[#0b2146]/90 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-[#0b2146] dark:hover:text-white font-bold"
                        }
                      `}
                      onClick={() => handleTeamClick(item.key)}
                    >
                      <div
                        className={`p-1.5 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${item.iconColor}`}
                      >
                        <Icon size={16} />
                      </div>
                      {!isCollapsed && <span className="flex-1 truncate text-[12.5px]">{item.name}</span>}
                      {isActive && (
                        <span
                          className={`w-2 h-2 rounded-full bg-blue-600 dark:bg-sky-400 shadow-[0_0_6px_rgba(37,99,235,0.6)] ${
                            isCollapsed ? "absolute right-2" : ""
                          }`}
                        />
                      )}
                    </button>
                  );
                } else {
                  const Icon = item.icon;
                  const isSmki = item.name === "SMKI";
                  const isThisGroupOpen = isSmki ? isSmkiGroupOpen : isAppGroupOpen;
                  const setIsThisGroupOpen = isSmki ? setIsSmkiGroupOpen : setIsAppGroupOpen;
                  const isThisGroupActive = isSmki ? isSmkiActive : isAppGroupActive;
                  return (
                    <div key={item.name} className="space-y-1">
                      <button
                        title={isCollapsed ? item.name : undefined}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold
                          transition-all duration-150 select-none outline-none group
                          ${isCollapsed ? "justify-center px-2" : ""}
                          ${
                            isThisGroupActive
                              ? isSmki
                                ? "bg-emerald-50/80 text-[#0b2146] font-extrabold shadow-xs border border-emerald-200/70 dark:bg-emerald-800/80 dark:text-white dark:border-emerald-500/50"
                                : "bg-purple-50/80 text-[#0b2146] font-extrabold shadow-xs border border-purple-200/70 dark:bg-[#1d4ed8]/80 dark:text-white dark:border-blue-500/50"
                              : "text-[#0b2146]/90 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-[#0b2146] dark:hover:text-white font-bold"
                          }
                        `}
                        onClick={() => {
                          if (isCollapsed) {
                            toggleCollapsed();
                            setIsThisGroupOpen(true);
                          } else {
                            setIsThisGroupOpen((prev) => !prev);
                          }
                        }}
                      >
                        <div
                          className={`p-1.5 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${item.iconColor}`}
                        >
                          <Icon size={16} />
                        </div>
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 truncate text-[12.5px] font-bold">{item.name}</span>
                            <div className="text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors ml-1">
                              {isThisGroupOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            </div>
                          </>
                        )}
                        {isCollapsed && isThisGroupActive && (
                          <span className={`w-2 h-2 rounded-full ${isSmki ? "bg-emerald-600" : "bg-purple-600"} dark:bg-sky-400 shadow-[0_0_6px_rgba(147,51,234,0.6)] absolute right-2`} />
                        )}
                      </button>

                      {/* Sub-items dropdown list */}
                      {!isCollapsed && isThisGroupOpen && (
                        <div className="ml-3 pl-3 border-l-2 border-slate-100 dark:border-slate-800 space-y-1 pt-1 animate-in fade-in duration-200">
                          {item.subItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              sub.key === "smki"
                                ? pathname === "/smki"
                                : sub.key === "daftar-aset-ti"
                                ? pathname === "/daftar-aset-ti" || pathname === "/smki/daftar-aset-ti"
                                : sub.key.includes("/")
                                ? pathname === `/${sub.key}`
                                : activeSegment === sub.key;
                            return (
                              <button
                                key={sub.key}
                                className={`
                                  w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-semibold
                                  transition-all duration-150 select-none outline-none group
                                  ${
                                    isSubActive
                                      ? "bg-blue-50/90 text-blue-700 font-extrabold shadow-xs border border-blue-200/70 dark:bg-[#1d4ed8] dark:text-white dark:border-blue-500/50"
                                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-[#0b2146] dark:hover:text-white"
                                  }
                                `}
                                onClick={() => handleTeamClick(sub.key)}
                              >
                                <div
                                  className={`p-1 rounded-md flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${sub.iconColor}`}
                                >
                                  <SubIcon size={14} />
                                </div>
                                <span className="flex-1 truncate text-[12px]">{sub.name}</span>
                                {isSubActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-sky-400 shadow-[0_0_5px_rgba(37,99,235,0.6)]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>

        {/* Footer Area with Profile and Logout */}
        <div
          className={`p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#071733] flex flex-col gap-3 ${
            isCollapsed ? "items-center" : ""
          }`}
        >
          <div
            className={`flex items-center gap-3 px-2 cursor-pointer group ${isCollapsed ? "justify-center" : ""}`}
            onClick={() => router.push("/profile")}
            title="Ke Profil Saya"
          >
            <Avatar name={userName} src={currentUser?.avatar_url || currentUser?.avatar} size="sm" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-[#0b2146] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  {userName}
                </h4>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {isMounted
                    ? (currentUser?.position ||
                        currentUser?.jabatan ||
                        (isAdminAptika ? "Admin Aptika" : bidang?.name || "Anggota Tim"))
                    : "Anggota Tim"}
                </p>
              </div>
            )}
          </div>
          <button
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-xs font-bold ${
              isCollapsed ? "justify-center" : ""
            }`}
            onClick={handleLogout}
          >
            <LogOut size={14} />
            {!isCollapsed && "Keluar Aplikasi"}
          </button>
        </div>
      </aside>
    </>
  );
}