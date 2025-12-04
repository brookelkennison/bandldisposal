'use client';

import Link from 'next/link';
import { Icon } from './Icon';

interface Service {
  icon: string;
  title: string;
  description: string;
  href: string;
  fullWidth?: boolean;
}

interface MoreInfoLink {
  title: string;
  description: string;
  href: string;
}

interface UtilityLink {
  icon: string;
  title: string;
  href: string;
}

interface DropdownMenuData {
  title: string;
  baseUrl: string;
  gridCols: 2 | 3;
  services: Service[];
  moreInformation?: {
    title: string;
    links: MoreInfoLink[];
  };
  utilityLinks: UtilityLink[];
}

interface DropdownMenuProps {
  data: DropdownMenuData;
  align?: 'left' | 'right';
}

export default function DropdownMenu({ data, align = 'left' }: DropdownMenuProps) {
  const { title, baseUrl, gridCols, services, moreInformation, utilityLinks } = data;

  return (
    <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 w-[600px] bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-6`}>
      {/* Services Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#002F1F' }}>
          {title}
        </h3>
        <div className={gridCols === 2 ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-3 gap-3'}>
          {services.map((service, index) => {
            const isFullWidth = service.fullWidth;
            const gridClass = isFullWidth 
              ? (gridCols === 2 ? 'col-span-2' : 'col-span-3')
              : '';
            const flexClass = gridCols === 2 
              ? 'flex items-center gap-3' 
              : 'flex flex-col items-center gap-2 text-center';
            
            return (
              <Link
                key={index}
                href={service.href}
                className={`${gridClass} ${flexClass} p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${isFullWidth ? 'mt-3' : ''}`}
              >
                <Icon name={service.icon} className="w-8 h-8 text-gray-700 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-gray-900">{service.title}</div>
                  <div className="text-xs text-gray-600">{service.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* More Information Section */}
      {moreInformation && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#002F1F' }}>
            {moreInformation.title}
          </h3>
          <div className="flex items-center gap-4">
            {moreInformation.links.map((link, index) => (
              <div key={index} className="flex items-center gap-4">
                {index > 0 && (
                  <div className="w-px h-4" style={{ backgroundColor: '#002F1F' }}></div>
                )}
                <div>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-700 hover:text-gray-900 transition-colors block"
                  >
                    {link.title}
                  </Link>
                  <span className="text-xs text-gray-500">{link.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Separator if no moreInformation */}
      {!moreInformation && <div className="mb-6 border-t border-gray-200"></div>}

      {/* Utility Links */}
      <div className="flex items-center gap-4 flex-wrap">
        {utilityLinks.map((link, index) => (
          <div key={index} className="flex items-center gap-4">
            {index > 0 && <div className="w-px h-4 bg-gray-300"></div>}
            <Link
              href={link.href}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <Icon name={link.icon} className="w-5 h-5" style={{ color: '#002F1F' }} />
              <span>{link.title}</span>
            </Link>
          </div>
        ))}
        <div className="w-px h-4 bg-gray-300"></div>
        <Link
          href={baseUrl}
          className="px-4 py-2 text-sm font-medium rounded border-2 transition-colors hover:bg-[#002F1F] hover:text-white"
          style={{
            borderColor: '#002F1F',
            color: '#002F1F'
          }}
        >
          See All Services
        </Link>
      </div>
    </div>
  );
}

