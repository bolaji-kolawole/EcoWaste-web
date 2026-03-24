
import { type NoseurObject } from "@ronuse/noseur";
import { BaseService, type SanitizedResponse } from "./BaseService";
import { User } from "../types";

export interface IAuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}

export interface UserRole {
  name: string;
  external_id: string;
}

export interface IUser {
    content: User[];
}

export class UserService extends BaseService {

    protected static instance: UserService;

    private constructor() {
        super();
    }

    static getInstance() {
        if (!UserService.instance) UserService.instance = new UserService();
        return UserService.instance;
    }

    login(payload: { email: string, password: string, roleId: string }): Promise<SanitizedResponse<any>> {
        return this.report(this.transport.post(`/auth/login`, payload));
    }

    signup(payload: { first_name: string, last_name: string, email: string, password: string }): Promise<SanitizedResponse<User>> {
        return this.report(this.transport.post(`/auth/register`, payload));
    }

    queryUser(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<User>> {
        return this.report(this.transport.get(`/auth/profile`));
    }

    queryUsers(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<any>> {
        return this.report(this.transport.get(`/auth`));
    }

    updateUser(external_id: string, payload: { first_name?: string, last_name?: string, email?: string, phone?: string, dob?: string }): Promise<SanitizedResponse<IUser>> {
        return this.report(this.transport.patch(`/auth/${external_id}`, payload));
    }


}
