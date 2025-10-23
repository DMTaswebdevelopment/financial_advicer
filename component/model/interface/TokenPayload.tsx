export interface TokenPayload {
  uid: string;
  email: string | null;
  userRole: string;
  name: string | null;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}
