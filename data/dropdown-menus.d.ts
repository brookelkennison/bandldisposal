export interface DropdownMenuData {
  title: string;
  baseUrl: string;
  gridCols: 2 | 3;
  services: Array<{
    icon: string;
    title: string;
    description: string;
    href: string;
    fullWidth?: boolean;
  }>;
  moreInformation?: {
    title: string;
    links: Array<{
      title: string;
      description: string;
      href: string;
    }>;
  };
  utilityLinks: Array<{
    icon: string;
    title: string;
    href: string;
  }>;
}

declare const dropdownMenus: {
  residential: DropdownMenuData;
  commercial: DropdownMenuData;
  industrial: DropdownMenuData;
  company: DropdownMenuData;
};

export default dropdownMenus;

