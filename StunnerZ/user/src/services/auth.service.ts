import cookie from 'js-cookie';
import {
  ILogin, IFanRegister, IForgot, IVerifyEmail
} from 'src/interfaces';
import { APIRequest, TOKEN } from './api-request';
import { getGlobalConfig } from './config';

export class AuthService extends APIRequest {
  public async login(data: ILogin) {
    return this.post('/auth/login', data);
  }
  public async logout(id) {
    return this.post('/auth/logout', id);
  }

  public async loginTwitter() {
    return this.get(
      this.buildUrl('/auth/twitter/login')
    );
  }

  public async loginGoogle(data: any) {
    return this.post('/auth/google/login', data);
  }

  updateSubAccountPassword(password: string, userId: string, source = 'user') {
    return this.put('/auth/users/sub-account/password', { password, source, userId });
  }

  public async callbackLoginTwitter(data) {
    return this.get(
      this.buildUrl('/auth/twitter/callback', data)
    );
  }

  public async verifyEmail(data: IVerifyEmail) {
    return this.post('/auth/email-verification', data);
  }

  setToken(token: string, remember = true): void {
    const expired = { expires: !remember ? 1 : 365 };
    cookie.set(TOKEN, token, expired);
    this.setAuthHeaderToken(token);
  }

  getToken(): string {
    return cookie.get(TOKEN);
  }

  setTwitterToken(data: any, role: string) {
    cookie.set('oauthToken', data.oauthToken, { expires: 1 });
    cookie.set('oauthTokenSecret', data.oauthTokenSecret, { expires: 1 });
    cookie.set('role', role, { expires: 1 });
  }

  getTwitterToken() {
    const oauthToken = cookie.get('oauthToken');
    const oauthTokenSecret = cookie.get('oauthTokenSecret');
    const role = cookie.get('role');
    return { oauthToken, oauthTokenSecret, role };
  }

  removeToken(): void {
    cookie.remove(TOKEN);
  }

  updatePassword(password: string, source?: string) {
    return this.put('/auth/users/me/password', { password, source });
  }

  resetPassword(data: IForgot) {
    return this.post('/auth/users/forgot', data);
  }

  register(data: IFanRegister) {
    return this.post('/auth/users/register', data);
  }

  registerPerformer(data: any) {
    return this.post('/auth/performers/register', data);
  }

  registerPerformerNewFlow(data: any) {
    // Jumio is required in new register flow
    // it will response Jumio verify link
    return this.post('/auth/performers/register-new', data);
  }

  jumioCreation(userId: string) {
    return this.post('/jumio/account-creation', { userId });
  }

  ondatoCreation(data: any) {
    return this.post('/ondato/generate-idv', data);
  }

  getAvatarUploadUrl() {
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/auth/performers/avatar/upload`;
  }

  getCoverUploadUrl() {
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/auth/performers/cover/upload`;
  }

  getVideoUploadUrl() {
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/auth/performers/welcome-video/upload`;
  }
}

export const authService = new AuthService();
