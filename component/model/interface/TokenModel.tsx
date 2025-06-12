export interface TokenModel {
  id: number;
  name: string;
  username: string;
  userRole: string;
  role: string;
  exp: number;
  iat: number;
  picture: string;
}
