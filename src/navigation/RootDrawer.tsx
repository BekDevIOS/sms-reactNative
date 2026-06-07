import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {useAppState} from '../state/AppState';
import {DrawerContent} from './DrawerContent';
import type {RootDrawerParamList} from './types';
import {
  AdminDashboardStack,
  AdminMembersStack,
  AdminPlansStack,
  AdminSmsLogsStack,
  AdminSubscriptionsStack,
  AutoReplyStack,
  CampaignsStack,
  ContactsStack,
  DashboardStack,
  DevicesStack,
  ProfileStack,
  SmsLogsStack,
  SubscriptionStack,
  TemplatesStack,
  UssdStack,
} from './stacks';

const Drawer = createDrawerNavigator<RootDrawerParamList>();

export function RootDrawer() {
  const {isAdmin} = useAppState();
  return (
    <Drawer.Navigator
      drawerContent={props => <DrawerContent {...props} />}
      screenOptions={{headerShown: false, drawerType: 'front'}}>
      <Drawer.Screen name="Dashboard" component={DashboardStack} />
      <Drawer.Screen name="Campaigns" component={CampaignsStack} />
      <Drawer.Screen name="Contacts" component={ContactsStack} />
      <Drawer.Screen name="Devices" component={DevicesStack} />
      <Drawer.Screen name="Templates" component={TemplatesStack} />
      <Drawer.Screen name="AutoReply" component={AutoReplyStack} />
      <Drawer.Screen name="SmsLogs" component={SmsLogsStack} />
      <Drawer.Screen name="Ussd" component={UssdStack} />
      <Drawer.Screen name="Subscription" component={SubscriptionStack} />
      <Drawer.Screen name="Profile" component={ProfileStack} />
      {isAdmin ? (
        <>
          <Drawer.Screen name="AdminDashboard" component={AdminDashboardStack} />
          <Drawer.Screen name="AdminMembers" component={AdminMembersStack} />
          <Drawer.Screen name="AdminPlans" component={AdminPlansStack} />
          <Drawer.Screen name="AdminSubscriptions" component={AdminSubscriptionsStack} />
          <Drawer.Screen name="AdminSmsLogs" component={AdminSmsLogsStack} />
        </>
      ) : null}
    </Drawer.Navigator>
  );
}
