"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { Car, Menu, Home, Search, History, User, Contact, Bell, Settings, LogOut, ChevronDown } from "lucide-react";

const Header = () => {
  const { isAuthenticated: isLoggedIn, user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-2xl hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="GoPark Logo" className="h-8 w-8" />
          <span className=" bg-clip-text text-black">Go <span className="text-green-600">Park</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-8 text-sm font-medium text-muted-foreground relative">
          <Link href="/" className="transition-colors hover:text-primary hover:font-semibold">
          <Home className="h-5 w-5 inline-block mr-1" />
            Trang chủ
          </Link>
          <Link href="/users/findParking" className="transition-colors hover:text-primary hover:font-semibold">
            <Search className="h-5 w-5 inline-block mr-1" />
            Tìm bãi đỗ
          </Link>
          <Link href="/users/myBooking" className="transition-colors hover:text-primary hover:font-semibold">
            <History className="h-5 w-5 inline-block mr-1" />
            Lịch sử đặt chỗ
          </Link>
          <Link href="/about" className="transition-colors hover:text-primary hover:font-semibold">
            <User className="h-5 w-5 inline-block mr-1" />
            Về chúng tôi
          </Link>
          <Link href="/contact" className="transition-colors hover:text-primary hover:font-semibold">
            <Contact className="h-5 w-5 inline-block mr-1" />
            Liên hệ
          </Link>
        </nav>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-3 md:gap-5">
              {/* Nút thông báo */}
              <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-stone-800">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-stone-900"></span>
              </button>

              {/* Avatar & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:pr-3 rounded-full border border-gray-200 dark:border-stone-700 hover:shadow-md transition-all bg-white dark:bg-stone-800"
                >
                  <img src={user?.avatar || "https://i.pravatar.cc/150?img=11"} alt="User Avatar" className="w-8 h-8 rounded-full object-cover" />
                  <span className="text-sm font-semibold max-w-[100px] truncate hidden sm:block dark:text-white">{user?.name || "Người dùng"}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-stone-900 border border-gray-100 dark:border-stone-800 rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-gray-50 dark:border-stone-800 mb-2">
                      <p className="text-sm font-bold text-black dark:text-white">{user?.name || "Người dùng"}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email || ""}</p>
                    </div>
                    
                    <Link href="/users/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-stone-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <User className="h-4 w-4" />
                      Thông tin cá nhân
                    </Link>
                    <Link href="/users/setting" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-stone-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <Settings className="h-4 w-4" />
                      Cài đặt
                    </Link>
                    
                    <div className="h-[1px] bg-gray-100 dark:bg-stone-800 my-1"></div>
                    
                    <button 
                      onClick={() => {
                        logout();
                        router.push("/auth/login");
                      }} 
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Button variant="ghost" className="font-semibold" asChild>
                <Link href="/auth/login">Đăng nhập</Link>
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 shadow-md font-semibold" asChild>
                <Link href="/auth/register">Đăng ký</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Menu" className="text-foreground">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
