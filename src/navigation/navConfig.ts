import type {IconName} from '../components/icons/UiIcons';

/** Drawer route names — one per feature stack. */
export type DrawerRoute =
  | 'Dashboard'
  | 'Campaigns'
  | 'Contacts'
  | 'Devices'
  | 'Templates'
  | 'AutoReply'
  | 'SmsLogs'
  | 'Ussd'
  | 'Subscription'
  | 'Profile'
  | 'AdminDashboard'
  | 'AdminMembers'
  | 'AdminPlans'
  | 'AdminSubscriptions'
  | 'AdminSmsLogs';

export interface NavItem {
  route: DrawerRoute;
  label: string;
  icon: IconName;
  disabled?: boolean;
}

export interface NavSection {
  title?: string;
  adminOnly?: boolean;
  items: NavItem[];
}

/** Mirrors the web frontend's NAV_SECTIONS (labels in Uzbek). */
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {route: 'Dashboard', label: 'Bosh sahifa', icon: 'chart'},
      {route: 'Campaigns', label: 'Tezkor SMS va tarix', icon: 'send'},
      {route: 'Devices', label: 'Ushbu telefon', icon: 'device'},
    ],
  },
  {
    title: 'Nazorat',
    items: [
      {route: 'SmsLogs', label: 'SMS jurnali', icon: 'inbox'},
    ],
  },
  {
    title: 'Hisob',
    items: [
      {route: 'Profile', label: 'Profil', icon: 'user'},
    ],
  },
];

/** Drawer header title shown in the React Navigation top bar per route. */
export const ROUTE_TITLES: Record<DrawerRoute, string> = {
  Dashboard: 'Bosh sahifa',
  Campaigns: 'Tezkor SMS va tarix',
  Contacts: 'Kontaktlar',
  Devices: 'Ushbu telefon',
  Templates: 'Shablonlar',
  AutoReply: 'Avto-javob',
  SmsLogs: 'SMS jurnali',
  Ussd: 'USSD',
  Subscription: 'Obuna',
  Profile: 'Profil',
  AdminDashboard: 'Admin panel',
  AdminMembers: 'Aʼzolar',
  AdminPlans: 'Tariflar',
  AdminSubscriptions: 'Obunalar',
  AdminSmsLogs: 'Global SMS jurnali',
};
