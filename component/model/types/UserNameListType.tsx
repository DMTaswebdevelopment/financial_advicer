export type UserNameListType = {
  id: string;
  email: string | null;
  name: string | null;
  interval: string | null;
  accessToken?: string | null;
  subscription?: boolean;
  productId?: string | null;
  photoUrl: string | null;
  userRole: string;
};
