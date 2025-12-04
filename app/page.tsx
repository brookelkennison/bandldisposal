import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold mb-6" style={{ color: '#002F1F' }}>
                Reliable Waste Disposal & Recycling Services
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Service beyond expectations. B&L Disposal provides comprehensive trash and recycling solutions for residential, commercial, and industrial customers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/start-service"
                  className="px-8 py-4 text-white text-lg font-semibold rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#6ABF43' }}
                >
                  Start Service
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 text-lg font-semibold rounded-lg border-2 transition-colors hover:bg-gray-50"
                  style={{ 
                    borderColor: '#6ABF43',
                    color: '#6ABF43'
                  }}
                >
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Right Column - Image/Visual */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg">
                <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
                  <Image
                    src="/bl-logo.png"
                    alt="B&L Disposal"
                    width={400}
                    height={400}
                    className="object-contain p-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#002F1F' }}>
              Our Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive waste management solutions tailored to your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Residential Service */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-[#6ABF43] transition-colors">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#6ABF43' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#002F1F' }}>
                Residential
              </h3>
              <p className="text-gray-600 mb-6">
                Reliable weekly trash and recycling pickup for your home. Flexible scheduling and competitive rates.
              </p>
              <Link
                href="/residential"
                className="inline-block text-sm font-semibold transition-colors"
                style={{ color: '#6ABF43' }}
              >
                Learn More →
              </Link>
            </div>

            {/* Commercial Service */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-[#6ABF43] transition-colors">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#6ABF43' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#002F1F' }}>
                Commercial
              </h3>
              <p className="text-gray-600 mb-6">
                Customized waste management solutions for businesses. Flexible pickup schedules and volume-based pricing.
              </p>
              <Link
                href="/commercial"
                className="inline-block text-sm font-semibold transition-colors"
                style={{ color: '#6ABF43' }}
              >
                Learn More →
              </Link>
            </div>

            {/* Industrial Service */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-[#6ABF43] transition-colors">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#6ABF43' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#002F1F' }}>
                Industrial
              </h3>
              <p className="text-gray-600 mb-6">
                Large-scale waste disposal and recycling services for industrial facilities. Dedicated containers and regular service.
              </p>
              <Link
                href="/industrial"
                className="inline-block text-sm font-semibold transition-colors"
                style={{ color: '#6ABF43' }}
              >
                Learn More →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#002F1F' }}>
              Why Choose B&L Disposal?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center" style={{ color: '#6ABF43' }}>
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#002F1F' }}>
                Reliable Service
              </h3>
              <p className="text-gray-600">
                Consistent, on-time pickup every week
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center" style={{ color: '#6ABF43' }}>
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#002F1F' }}>
                Eco-Friendly
              </h3>
              <p className="text-gray-600">
                Comprehensive recycling programs
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center" style={{ color: '#6ABF43' }}>
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#002F1F' }}>
                Competitive Pricing
              </h3>
              <p className="text-gray-600">
                Fair, transparent rates with no hidden fees
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center" style={{ color: '#6ABF43' }}>
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#002F1F' }}>
                Local Experts
              </h3>
              <p className="text-gray-600">
                Serving your community for years
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6" style={{ color: '#002F1F' }}>
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of satisfied customers who trust B&L Disposal for their waste management needs.
          </p>
          <Link
            href="/start-service"
            className="inline-block px-10 py-5 text-white text-lg font-semibold rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: '#6ABF43' }}
          >
            Start Your Service Today
          </Link>
        </div>
      </section>
    </div>
  );
}
