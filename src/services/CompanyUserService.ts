
import { type NoseurObject } from "@ronuse/noseur";
import { BaseService, type SanitizedResponse } from "./BaseService";



export interface UserRole {
    name: string;
    external_id: string;
}

export interface CompanyUser {
    user_id: string;
    company_id: string;
    external_id: string;
}

export interface ICompanyUser {
    content: CompanyUser[];
}

export class CompanyUserService extends BaseService {

    protected static instance: CompanyUserService;

    private constructor() {
        super();
    }

    static getInstance() {
        if (!CompanyUserService.instance) CompanyUserService.instance = new CompanyUserService();
        return CompanyUserService.instance;
    }


    createCompanyUser(payload: { company_id: string, user_id: string }): Promise<SanitizedResponse<ICompanyUser>> {
        return this.report(this.transport.post(`/company-user`, payload));
    }

    queryCompanyUser(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<ICompanyUser>> {
        return this.report(this.transport.get(`/company-user`, { query: this.normalizeParams(params) }));
    }

    updateCompanyUser(external_id: string, payload: {  }): Promise<SanitizedResponse<ICompanyUser>> {
        return this.report(this.transport.patch(`/company-user/${external_id}`, payload));
    }
}
