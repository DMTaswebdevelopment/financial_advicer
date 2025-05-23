export interface TokenModel {
  _id: number;
  name: string;
  username: string;
  role: string;
  exp: number;
  iat: number;
  picture: string;
}
