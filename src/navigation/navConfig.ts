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
      {route: 'Dashboard', label: 'Boshqaruv paneli', icon: 'chart'},
      {route: 'Campaigns', label: 'Xabarlar', icon: 'send'},
      {route: 'Contacts', label: 'Kontaktlar', icon: 'contacts'},
      {route: 'Devices', label: 'Qurilmalar', icon: 'device'},
    ],
  },
  {
    title: 'Avtomatlashtirish',
    items: [
      {route: 'Templates', label: 'Shablonlar', icon: 'template'},
      {route: 'AutoReply', label: 'Avto-javob', icon: 'reply'},
      {route: 'SmsLogs', label: 'SMS jurnali', icon: 'inbox'},
      {route: 'Ussd', label: 'USSD', icon: 'phone', disabled: true},
    ],
  },
  {
    title: 'Hisob',
    items: [
      {route: 'Subscription', label: 'Obuna', icon: 'credit'},
      {route: 'Profile', label: 'Profil', icon: 'user'},
    ],
  },
  {
    title: 'Administrator',
    adminOnly: true,
    items: [
      {route: 'AdminDashboard', label: 'Admin panel', icon: 'grid'},
      {route: 'AdminMembers', label: 'Aʼzolar', icon: 'contacts'},
      {route: 'AdminPlans', label: 'Tariflar', icon: 'credit'},
      {route: 'AdminSubscriptions', label: 'Obunalar', icon: 'shield'},
      {route: 'AdminSmsLogs', label: 'Global SMS jurnali', icon: 'inbox'},
    ],
  },
];

/** Drawer header title shown in the React Navigation top bar per route. */
export const ROUTE_TITLES: Record<DrawerRoute, string> = {
  Dashboard: 'Boshqaruv paneli',
  Campaigns: 'Xabarlar',
  Contacts: 'Kontaktlar',
  Devices: 'Qurilmalar',
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
