
import { type NoseurObject } from "@ronuse/noseur";
import { BaseService, type SanitizedResponse } from "./BaseService";


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

export interface IAddress {
    content: Address;
}


export class AddressService extends BaseService {

    protected static instance: AddressService;

    private constructor() {
        super();
    }

    static getInstance() {
        if (!AddressService.instance) AddressService.instance = new AddressService();
        return AddressService.instance;
    }

    queryAddresss(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<IAddress>> {
        return this.report(this.transport.get(`/address`, { query: this.normalizeParams(params) }));
    }

    createAddress(payload: {street: string, city: string, state: string, postal_code: string }): Promise<SanitizedResponse<Address>> {
            return this.report(this.transport.post(`/address`, payload));
    }
    updateAddress(external_id: string, payload: {street: string, city: string, state: string, postal_code: string }): Promise<SanitizedResponse<Address>> {
            return this.report(this.transport.patch(`/address/${external_id}`, payload));
    }

}
