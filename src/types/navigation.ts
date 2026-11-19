export type RoutePath =
  | '/'
  | '/platform'
  | '/studio'
  | '/workflow-automation'
  | '/context'
  | '/developers'
  | '/solutions'
  | '/resources'
  | '/pricing'
  | '/about'
  | '/contact'
  | '/docs'
  | '/app';

export interface NavDropdownItem {
  label: string;
  description: string;
  href: RoutePath;
  sectionId?: string;
  status?: 'Preview' | 'Planned' | 'Coming Soon';
}

export interface NavCategory {
  id: 'platform' | 'solutions' | 'developers' | 'resources' | 'pricing' | 'company';
  label: string;
  href?: RoutePath;
  items?: NavDropdownItem[];
}

export interface RouteMeta {
  title: string;
  description: string;
  canonicalPath: RoutePath;
}
