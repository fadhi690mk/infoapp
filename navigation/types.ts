export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  ProductDetails: { id: string };
  SubmitSale: { productId?: string };
  SubmitProof: { campaignId?: number; campaignTitle?: string };
};

export type MainTabsParamList = {
  Dashboard: undefined;
  Products: undefined;
  MySales: undefined;
  Earnings: undefined;
  Bank: undefined;
  Profile: undefined;
};
