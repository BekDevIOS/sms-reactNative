import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {rootScreenHeader, stackHeader} from './headerOptions';
import {ROUTE_TITLES} from './navConfig';
import type {
  AdminMembersStackParamList,
  CampaignsStackParamList,
  ContactsStackParamList,
} from './types';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import DevicesScreen from '../screens/devices/DevicesScreen';
import TemplatesScreen from '../screens/templates/TemplatesScreen';
import AutoReplyScreen from '../screens/autoReply/AutoReplyScreen';
import SmsLogsScreen from '../screens/messages/SmsLogsScreen';
import UssdScreen from '../screens/ussd/UssdScreen';
import MySubscriptionScreen from '../screens/subscription/MySubscriptionScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CampaignsListScreen from '../screens/campaigns/CampaignsListScreen';
import CampaignCreateScreen from '../screens/campaigns/CampaignCreateScreen';
import CampaignDetailScreen from '../screens/campaigns/CampaignDetailScreen';
import ContactsScreen from '../screens/contacts/ContactsScreen';
import ContactGroupsScreen from '../screens/contacts/ContactGroupsScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import MembersScreen from '../screens/admin/MembersScreen';
import MemberDetailScreen from '../screens/admin/MemberDetailScreen';
import AdminPlansScreen from '../screens/admin/AdminPlansScreen';
import AdminSubscriptionsScreen from '../screens/admin/AdminSubscriptionsScreen';
import AdminSmsLogsScreen from '../screens/admin/AdminSmsLogsScreen';

/** Builds a single-screen stack with the drawer hamburger header. */
function single(title: string, Component: React.ComponentType<any>) {
  const Stack = createNativeStackNavigator();
  return function SingleStack() {
    return (
      <Stack.Navigator screenOptions={stackHeader}>
        <Stack.Screen name="Main" component={Component} options={{title, ...rootScreenHeader}} />
      </Stack.Navigator>
    );
  };
}

export const DashboardStack = single(ROUTE_TITLES.Dashboard, DashboardScreen);
export const DevicesStack = single(ROUTE_TITLES.Devices, DevicesScreen);
export const TemplatesStack = single(ROUTE_TITLES.Templates, TemplatesScreen);
export const AutoReplyStack = single(ROUTE_TITLES.AutoReply, AutoReplyScreen);
export const SmsLogsStack = single(ROUTE_TITLES.SmsLogs, SmsLogsScreen);
export const UssdStack = single(ROUTE_TITLES.Ussd, UssdScreen);
export const SubscriptionStack = single(ROUTE_TITLES.Subscription, MySubscriptionScreen);
export const ProfileStack = single(ROUTE_TITLES.Profile, ProfileScreen);
export const AdminDashboardStack = single(ROUTE_TITLES.AdminDashboard, AdminDashboardScreen);
export const AdminPlansStack = single(ROUTE_TITLES.AdminPlans, AdminPlansScreen);
export const AdminSubscriptionsStack = single(ROUTE_TITLES.AdminSubscriptions, AdminSubscriptionsScreen);
export const AdminSmsLogsStack = single(ROUTE_TITLES.AdminSmsLogs, AdminSmsLogsScreen);

const Campaigns = createNativeStackNavigator<CampaignsStackParamList>();
export function CampaignsStack() {
  return (
    <Campaigns.Navigator screenOptions={stackHeader}>
      <Campaigns.Screen name="CampaignsList" component={CampaignsListScreen} options={{title: ROUTE_TITLES.Campaigns, ...rootScreenHeader}} />
      <Campaigns.Screen name="CampaignCreate" component={CampaignCreateScreen} options={{title: 'Yangi xabar'}} />
      <Campaigns.Screen name="CampaignDetail" component={CampaignDetailScreen} options={{title: 'Kampaniya'}} />
    </Campaigns.Navigator>
  );
}

const Contacts = createNativeStackNavigator<ContactsStackParamList>();
export function ContactsStack() {
  return (
    <Contacts.Navigator screenOptions={stackHeader}>
      <Contacts.Screen name="ContactsList" component={ContactsScreen} options={{title: ROUTE_TITLES.Contacts, ...rootScreenHeader}} />
      <Contacts.Screen name="ContactGroups" component={ContactGroupsScreen} options={{title: 'Guruhlar'}} />
    </Contacts.Navigator>
  );
}

const AdminMembers = createNativeStackNavigator<AdminMembersStackParamList>();
export function AdminMembersStack() {
  return (
    <AdminMembers.Navigator screenOptions={stackHeader}>
      <AdminMembers.Screen name="MembersList" component={MembersScreen} options={{title: ROUTE_TITLES.AdminMembers, ...rootScreenHeader}} />
      <AdminMembers.Screen name="MemberDetail" component={MemberDetailScreen} options={{title: 'Aʼzo'}} />
    </AdminMembers.Navigator>
  );
}
