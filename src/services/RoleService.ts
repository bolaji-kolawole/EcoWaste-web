
import { type NoseurObject } from "@ronuse/noseur";
import { BaseService, type SanitizedResponse } from "./BaseService";


export interface Role {
  name: string;
  external_id: string;
}

export interface IRole {
  content: Role[];
  name: string;
  externalId: string;
}

export interface UserRole {
  role_id: string;
  user_id: string;
  external_id: string;
}

export interface IUserRole {
  content: UserRole[];
  externalId: string;
}

export class RoleService extends BaseService {

  protected static instance: RoleService;

  private constructor() {
    super();
  }

  static getInstance() {
    if (!RoleService.instance) RoleService.instance = new RoleService();
    return RoleService.instance;
  }

  queryRoles(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<IRole>> {
    return this.report(this.transport.get(`/role`));
  }

  queryUserRoles(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<IUserRole>> {
    return this.report(this.transport.get(`/user-role`));
  }

  createUserRole(payload: { user_id: string, role_id: string }): Promise<SanitizedResponse<IRole>> {
    return this.report(this.transport.post(`/user-role`, payload));
  }
}
