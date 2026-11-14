import React from 'react';
import {
  LayoutDashboard,
  School,
  GraduationCap,
  Layers,
  Users,
  Sparkles,
  ClipboardCheck,
  Printer,
  Settings,
  ChevronRight,
  ShieldCheck,
  LogIn,
  LogOut
} from 'lucide-react';
import { UserAccount } from '../../types';
import { SchoolLogo } from '../ui/SchoolLogo';
import { isAdminOnlyTab } from '../../utils/assessmentHelpers';

export type NavTab =
  | 'dashboard'
  | 'school-profile'
  | 'teachers'
  | 'classes'
  | 'students'
  | 'characters'
  | 'assessments'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isAdminLoggedIn: boolean;
  adminUser: UserAccount | null;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  schoolName: string;
  logoUrl?: string;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isAdminLoggedIn,
  adminUser,
  onOpenAdminLogin,
  onLogoutAdmin,
  schoolName,
  logoUrl,
  isOpenMobile,
  onCloseMobile
}: SidebarProps) {

  const menuItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />
    },
    {
      id: 'school-profile',
      label: 'Profil Sekolah',
      icon: <School className="w-5 h-5 shrink-0" />
    },
    {
      id: 'teachers',
      label: 'Data Guru',
      icon: <GraduationCap className="w-5 h-5 shrink-0" />
    },
    {
      id: 'classes',
      label: 'Data Kelas',
      icon: <Layers className="w-5 h-5 shrink-0" />
    },
    {
      id: 'students',
      label: 'Data Siswa',
      icon: <Users className="w-5 h-5 shrink-0" />
    },
    {
      id: 'characters',
      label: 'Data Karakter',
      icon: <Sparkles className="w-5 h-5 shrink-0" />
    },
    {
      id: 'assessments',
      label: 'Penilaian Karakter',
      icon: <ClipboardCheck className="w-5 h-5 shrink-0" />,
      badge: 'Utama'
    },
    {
      id: 'reports',
      label: 'Cetak Rapor',
      icon: <Printer className="w-5 h-5 shrink-0" />
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: <Settings className="w-5 h-5 shrink-0" />
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden no-print"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-gradient-to-b from-[#153e6b] via-[#1a4b80] to-[#113156] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3.5 bg-black/10">
          <SchoolLogo size="md" logoUrl={logoUrl} />
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-sm tracking-wide text-white leading-tight uppercase truncate">
              {schoolName || 'SD Islam Al-Jannah'}
            </h1>
            <p className="text-[11px] text-amber-300 font-semibold tracking-wider uppercase mt-0.5">
              Rapor Karakter
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigasi Utama
          </div>
          {menuItems
            .filter(item => !isAdminOnlyTab(item.id) || isAdminLoggedIn)
            .map(item => {
              const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 translate-x-1'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={isActive ? 'text-slate-950' : 'text-slate-300 group-hover:text-amber-300'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isActive
                          ? 'bg-slate-900 text-amber-300'
                          : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-slate-950" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Admin Auth Footer + Version */}
        <div className="p-4 border-t border-white/10 bg-black/15 text-[11px] text-slate-400 flex flex-col gap-3">
          {isAdminLoggedIn ? (
            <div className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">Administrator</p>
                  <p className="text-[10px] text-amber-300 font-mono truncate">
                    @{adminUser?.username || 'webdevaj'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogoutAdmin();
                  onCloseMobile();
                }}
                className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="Keluar dari akun Administrator"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onOpenAdminLogin();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-300" />
              <span>Login Administrator</span>
            </button>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-300">
              <span>Versi Aplikasi</span>
              <span className="font-mono text-amber-300 font-bold">v2.4.0</span>
            </div>
            <p className="text-[10px] leading-tight text-slate-400 mt-1">
              Islam • Alam • Sains • Al-Jannah
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
