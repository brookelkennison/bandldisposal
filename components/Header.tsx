'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import DropdownMenu from './DropdownMenu';
import dropdownMenusData from '@/data/dropdown-menus.json';
import type { DropdownMenuData } from '@/data/dropdown-menus';

const dropdownMenus = {
  residential: dropdownMenusData.residential as DropdownMenuData,
  commercial: dropdownMenusData.commercial as DropdownMenuData,
  industrial: dropdownMenusData.industrial as DropdownMenuData,
  company: dropdownMenusData.company as DropdownMenuData,
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full">
      {/* Top Utility Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-10 gap-4">
            {/* Schedule */}
            <Link 
              href="/schedule" 
              className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <span>Schedule</span>
            </Link>

            {/* Divider */}
            <div className="h-4 w-px bg-gray-300" />

            {/* Contact */}
            <Link 
              href="/contact" 
              className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
              <span>Contact</span>
            </Link>

            {/* Divider */}
            <div className="h-4 w-px bg-gray-300" />

            {/* My Account */}
            <Link 
              href="/account" 
              className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
              <span>My Account</span>
            </Link>

            {/* Search */}
            <button 
              className="ml-2 p-1 text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Search"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left Side - Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/bl-logo.png"
                  alt="B&L Disposal Logo"
                  width={300}
                  height={200}
                  className="h-auto object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Right Side - Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6">
              {/* Residential Dropdown */}
              <div className="relative group">
                <Link 
                  href="/residential" 
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Residential
                  <svg 
                    className="w-3 h-3" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                </Link>
                <DropdownMenu data={dropdownMenus.residential} />
              </div>

              {/* Commercial Dropdown */}
              <div className="relative group">
                <Link 
                  href="/commercial" 
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Commercial
                  <svg 
                    className="w-3 h-3" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                </Link>
                <DropdownMenu data={dropdownMenus.commercial} />
              </div>

              {/* Industrial Dropdown */}
              <div className="relative group">
                <Link 
                  href="/industrial" 
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Industrial
                  <svg 
                    className="w-3 h-3" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                </Link>
                <DropdownMenu data={dropdownMenus.industrial} align="right" />
              </div>

              {/* Company Dropdown */}
              <div className="relative group">
                <Link 
                  href="/company" 
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Company
                  <svg 
                    className="w-3 h-3" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                </Link>
                <DropdownMenu data={dropdownMenus.company} align="right" />
              </div>

              {/* FAQs */}
              <Link 
                href="/faqs" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                FAQs
              </Link>

              {/* Jobs */}
              <Link 
                href="/jobs" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Jobs
              </Link>

              {/* Start Service Button */}
              <Link 
                href="/start-service"
                className="ml-2 px-6 py-2.5 text-white text-sm font-medium rounded transition-colors bg-[#6ABF43] hover:bg-[#5AA833]"
              >
                Start Service
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-gray-700 hover:text-gray-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <Link 
                href="/residential" 
                className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                Residential
              </Link>
              <Link 
                href="/commercial" 
                className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                Commercial
              </Link>
              <Link 
                href="/industrial" 
                className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                Industrial
              </Link>
              <Link 
                href="/company" 
                className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                Company
              </Link>
              <Link 
                href="/faqs" 
                className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQs
              </Link>
              <Link 
                href="/jobs" 
                className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                Jobs
              </Link>
              <Link 
                href="/start-service"
                className="block mt-4 px-6 py-2.5 text-white text-sm font-medium rounded text-center transition-colors bg-[#6ABF43] hover:bg-[#5AA833]"
                onClick={() => setIsMenuOpen(false)}
              >
                Start Service
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

