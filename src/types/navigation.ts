export type StaticRoutePath =
  | '/'
  | '/platform'
  | '/studio'
  | '/flow'
  | '/workflow-automation'
  | '/decisions'
  | '/context'
  | '/graph'
  | '/runtime'
  | '/gateway'
  | '/observe'
  | '/evaluate'
  | '/control'
  | '/cloud'
  | '/enterprise'
  | '/security'
  | '/developers'
  | '/solutions'
  | '/research'
  | '/resources'
  | '/pricing'
  | '/about'
  | '/contact'
  | '/legal'
  | '/docs'
  | '/app';

export type DynamicRoutePath =
  | `/docs/${string}`
  | `/resources/${string}`
  | `/research/${string}`;

export type RoutePath = StaticRoutePath | DynamicRoutePath;

export interface NavDropdownItem {
  label: string;
  description: string;
  href: RoutePath;
  sectionId?: string;
  status?: 'Preview' | 'Planned' | 'Coming Soon' | 'Roadmap';
}

export interface NavCategory {
  id: 'platform' | 'solutions' | 'research' | 'resources' | 'company' | 'docs';
  label: string;
  href?: RoutePath;
  items?: NavDropdownItem[];
}

export interface RouteMeta {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string;
}
