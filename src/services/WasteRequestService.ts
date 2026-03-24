
import { type NoseurObject } from "@ronuse/noseur";
import { BaseService, type SanitizedResponse } from "./BaseService";
import { User } from "../types";


export interface WasteRequest {
    name: string;
    external_id: string;
    user_id: string;
    recycling_company_id: string;
    waste_type_id: string;
    address_id: string;
    description: string;
    status: string;
    quantity: string;
    created_at: string;
    scheduled_date?: Date;
}

export interface RecyclingCompany {
    name: string;
    email: string;
    phone: string;
    address: string;
    cluster_id: string;
    external_id: string;
    status: string;
}

export interface WasteType {
    name: string;
    external_id: string;

}

export interface Address {
    cluster_id: string;
    user_id: string;
    street: string;
    city?: string;
    state?: string;
    postal_code?: string;
    latitude: string;
    longitude: string;
    external_id: string;

}

export interface Notification {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    recipient_role: string;
    recipient_id: string;
    external_id: string;
}

export interface RequestImage {
    waste_request_id: string;
    images: any;
}

export interface ClusterRequest {
    external_id: string;
    cluster_id: string;
    waste_request_id: string;
}

export interface StreetCluster {
    external_id: string;
    area: string;
    lga: string;
    created_at: string;
}

export interface RequestStatus {
    waste_request_id: string;
    status: string;
    accepted_at: Date;
    assigned_at: Date;
    completed_at: Date;
    cancelled_at: Date;
    external_id: string;
}

export interface RewardTransaction {
    user_id: string;
    points: string;
}


export interface IClusterRequest {
    content: ClusterRequest[];
}

export interface IStreetCluster {
    content: StreetCluster[];
}
export interface IRecyclingCompany {
    content: RecyclingCompany[];
}

export interface IAddress {
    content: Address[];
}

export interface IWasteType {
    content: WasteType[];
}

export interface IWasteRequest {
    content: WasteRequest[];
}

export interface IRequestImage {
    content: RequestImage[];
}

export interface INotification {
    content: Notification[];
}

export interface IRequestStatus {
    content: RequestStatus[]
}

export interface IRewardTransaction {
    content: RewardTransaction[]
}

export class WasteRequestService extends BaseService {

    protected static instance: WasteRequestService;

    private constructor() {
        super();
    }

    static getInstance() {
        if (!WasteRequestService.instance) WasteRequestService.instance = new WasteRequestService();
        return WasteRequestService.instance;
    }

    queryWasteTypes(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<IWasteType>> {
        return this.report(this.transport.get(`/waste-type`, { query: this.normalizeParams(params) }));
    }

    queryWasteRequests(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<IWasteRequest>> {
        return this.report(this.transport.get(`/waste-request`, { query: this.normalizeParams(params) }));
    }

    queryWasteRequestStatus(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<IRequestStatus>> {
        return this.report(this.transport.get(`/waste-request-status`, { query: this.normalizeParams(params) }));
    }

    queryUserAddress(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<IAddress>> {
        return this.report(this.transport.get(`/address`, { query: this.normalizeParams(params) }));
    }

    queryRecyclingCompany(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<IRecyclingCompany>> {
        return this.report(this.transport.get(`/recycling-company`, { query: this.normalizeParams(params) }));
    }

    createNotification(payload: { title: string, message: string, recipient_role: string, recipient_id: string, type: string }): Promise<SanitizedResponse<INotification>> {
        return this.report(this.transport.post(`/notification`, payload));
    }

    createWasteRequest(payload: { waste_type_id: string, address_id: string, quantity: string, description: string }): Promise<SanitizedResponse<WasteRequest>> {
        return this.report(this.transport.post(`/waste-request`, payload));
    }


    acceptWasteRequest(external_id: string, payload: { recycling_company_id: string }): Promise<SanitizedResponse<WasteRequest>> {
        return this.report(this.transport.patch(`/waste-request/${external_id}`, payload));
    }

    createWasteRequestStatus(payload: { waste_request_id: string }): Promise<SanitizedResponse<RequestStatus>> {
        return this.report(this.transport.post(`/waste-request-status`, payload));
    }

    updateWasteRequestStatus(external_id: string, payload: { status: string, accepted_at?: string, completed_at?: string }): Promise<SanitizedResponse<RequestStatus>> {
        return this.report(this.transport.patch(`/waste-request-status/${external_id}`, payload));
    }

    createWasteRequestImage(payload: { waste_request_id: string, images: any }): Promise<SanitizedResponse<RequestImage>> {
        return this.report(this.transport.post(`/request-image`, payload));
    }

    createClusterRequest(payload: { cluster_id: string, waste_request_id: string }): Promise<SanitizedResponse<IClusterRequest>> {
        return this.report(this.transport.post(`/cluster-request`, payload));
    }
    queryClusterRequest(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<IClusterRequest>> {
        return this.report(this.transport.get(`/cluster-request`, { query: this.normalizeParams(params) }));
    }

    queryRequestUser(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<User>> {
        return this.report(this.transport.get(`/auth`, { query: this.normalizeParams(params) }));
    }

    queryClusters(params: NoseurObject<string | number> = { page: 1, size: 50 }): Promise<SanitizedResponse<IStreetCluster>> {
        return this.report(this.transport.get(`/street-cluster`, { query: this.normalizeParams(params) }));
    }

    createRequestPoint(payload: { user_id: string, points: number }): Promise<SanitizedResponse<RewardTransaction>> {
        return this.report(this.transport.post(`/reward-transaction`, payload));
    }

    queryRequestPoint(params: NoseurObject<string | number> = { page: 1, size: 50 }): Promise<SanitizedResponse<IRewardTransaction>> {
        return this.report(this.transport.get(`/reward-transaction`, { query: this.normalizeParams(params) }));
    }

    queryWasteRequestImage(params: NoseurObject<string | number> = { page: 1, size: 50 }): Promise<SanitizedResponse<IRequestImage>> {
        return this.report(this.transport.get(`/request-image`, { query: this.normalizeParams(params) }));
    }
}