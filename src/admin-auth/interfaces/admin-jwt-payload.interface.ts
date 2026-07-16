export interface AdminAccessTokenPayload {
  sub: string;
  username: string;
  store_id: string;
  token_type: 'admin_access';
}

export interface AdminRefreshTokenPayload {
  sub: string;
  token_type: 'admin_refresh';
}
