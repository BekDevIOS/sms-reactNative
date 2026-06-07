import type {DrawerRoute} from './navConfig';

// Per-feature stack param lists (only features with detail navigation use a stack).
export type CampaignsStackParamList = {
  CampaignsList: undefined;
  CampaignCreate: undefined;
  CampaignDetail: {id: string};
};

export type ContactsStackParamList = {
  ContactsList: undefined;
  ContactGroups: undefined;
};

export type AdminMembersStackParamList = {
  MembersList: undefined;
  MemberDetail: {id: string};
};

export type RootDrawerParamList = {
  [K in DrawerRoute]: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};
