'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative" style={{ backgroundColor: '#002F1F' }}>
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#002F1F' }}
          aria-label="Scroll to top"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Customer Support */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
              Customer Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/pay-bill" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Pay My Bill
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Pickup Schedule
                </Link>
              </li>
              <li>
                <Link href="/broken-container" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Broken Container
                </Link>
              </li>
              <li>
                <Link href="/missed-pickup" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Missed Pickup
                </Link>
              </li>
              <li>
                <Link href="/moving" className="text-white text-sm hover:opacity-80 transition-opacity">
                  I Am Moving
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-white text-sm hover:opacity-80 transition-opacity">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/employment" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Employment
                </Link>
              </li>
              <li>
                <Link href="/sustainability" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Sustainability
                </Link>
              </li>
            </ul>
          </div>

          {/* Residential Services */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
              Residential Services
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/residential/garbage" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Garbage Pickup Service
                </Link>
              </li>
              <li>
                <Link href="/residential/bulk" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Bulk Pickup
                </Link>
              </li>
              <li>
                <Link href="/residential/hazardous" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Household Hazardous Waste
                </Link>
              </li>
              <li>
                <Link href="/residential/recycling" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Recycling Service
                </Link>
              </li>
              <li>
                <Link href="/residential/yard-waste" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Yard Waste Pickup
                </Link>
              </li>
              <li>
                <Link href="/residential/guide" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Disposal / Recycle Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Commercial Services */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
              Commercial Services
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/commercial/waste-management" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Waste Management
                </Link>
              </li>
              <li>
                <Link href="/commercial/recycling" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Commercial Recycling
                </Link>
              </li>
              <li>
                <Link href="/commercial/containers" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Container Sizes
                </Link>
              </li>
              <li>
                <Link href="/commercial/compactor" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Compactor Rental
                </Link>
              </li>
            </ul>
          </div>

          {/* Industrial Services */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
              Industrial Services
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/industrial/dumpster" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Dumpster Rental
                </Link>
              </li>
              <li>
                <Link href="/industrial/compactor" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Industrial Compactor Rental
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/company/about" className="text-white text-sm hover:opacity-80 transition-opacity">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/company/philosophy" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Our Company Philosophy
                </Link>
              </li>
              <li>
                <Link href="/company/transfer" className="text-white text-sm hover:opacity-80 transition-opacity">
                  Conshohocken Recycling & Rail Transfer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left Side - Logo and Phone */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex flex-col items-start gap-2">
                <Image
                  src="/bl-logo.png"
                  alt="B&L Disposal Logo"
                  width={80}
                  height={60}
                  className="h-auto object-contain brightness-0 invert"
                />
                <div className="text-white text-sm leading-tight">
                  <div className="font-semibold">B&L</div>
                  <div className="text-xs">Trash & Recycling Service</div>
                </div>
              </div>
              <div className="text-white text-lg font-medium">
                610-942-2707
              </div>
            </div>

            {/* Right Side - Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/start-service"
                className="px-6 py-2.5 text-white text-sm font-medium rounded border-2 border-white transition-colors hover:bg-white/10"
              >
                Start Service
              </Link>
              <Link
                href="/request-quote"
                className="px-6 py-2.5 bg-white text-sm font-medium rounded transition-colors hover:opacity-90"
                style={{ color: '#002F1F' }}
              >
                Request Quote
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

