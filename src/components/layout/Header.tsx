import React from 'react';
import {
  Menu,
  Calendar,
  Database,
  ShieldCheck,
  LogIn,
  LogOut
} from 'lucide-react';
import { UserAccount, SchoolProfile } from '../../types';

interface HeaderProps {
  pageTitle: string;
  pageSubtitle?: string;
  schoolProfile: SchoolProfile;
  isAdminLoggedIn: boolean;
  adminUser: UserAccount | null;
  syncMode?: 'supabase' | 'memory';
  isSyncing?: boolean;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenMobileSidebar: () => void;
}

export function Header({
  pageTitle,
  pageSubtitle,
  schoolProfile,
  isAdminLoggedIn,
  adminUser,
  syncMode = 'memory',
  isSyncing = false,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenMobileSidebar
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs no-print">
      {/* Left section: Hamburger and Page title */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Buka Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {pageTitle}
            </h2>
          </div>
          {pageSubtitle && (
            <p className="text-xs sm:text-sm text-slate-500 font-medium hidden sm:block">
              {pageSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right section: Academic year badge, DB status & Admin Login */}
      <div className="flex items-center gap-3">
        {/* Academic Year & Semester Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200/60 rounded-xl text-xs">
          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <span>TA: <strong className="text-blue-700">{schoolProfile.activeAcademicYear}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold">
              Sem {schoolProfile.activeSemester}
            </span>
          </div>
        </div>

        {/* Database indicator */}
        <div
          title={
            syncMode === 'supabase'
              ? 'CRUD terhubung langsung ke database PostgreSQL Supabase'
              : 'Belum terhubung ke Supabase (konfigurasi URL & Anon Key di menu Pengaturan)'
          }
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium cursor-help ${
            syncMode === 'supabase'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <Database className={`w-3.5 h-3.5 ${syncMode === 'supabase' ? 'text-emerald-600' : 'text-amber-600'}`} />
          <span className="text-[11px] font-semibold">
            {isSyncing
              ? 'Menyinkronkan...'
              : syncMode === 'supabase'
              ? 'Supabase Terhubung'
              : 'Belum Konek Supabase'}
          </span>
        </div>

        {/* Administrator Login / Active Status */}
        {isAdminLoggedIn ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50/70 text-left shadow-xs">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-100 text-amber-800 border border-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  Administrator
                </p>
                <p className="text-[10px] text-amber-800 font-mono font-semibold">
                  @{adminUser?.username || 'webdevaj'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogoutAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
              title="Keluar dari Administrator"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login Admin</span>
          </button>
        )}
      </div>
    </header>
  );
}
