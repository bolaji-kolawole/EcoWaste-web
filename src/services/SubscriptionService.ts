
import { type NoseurObject } from "@ronuse/noseur";
import { BaseService, type SanitizedResponse } from "./BaseService";


export interface Subscription {
    name: string;
    external_id: string;
    price: any;

}

export interface UserSubscription {
    plan_name: string;
    external_id: string;
    plan_id?: string;
    start_date: any;
    end_date: any;

}

export interface IUserSubscription {
    content: UserSubscription[];
}

export interface ISubscription {
    content: Subscription[];
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string;
  user_subscription_id: string;
  amount: number;
  payment_method: 'paystack' | 'flutterwave';
  reference: string;
  created_at: string;
  status: string;
}

export interface IPayment {
    content: Payment[];
}

export class SubscriptionService extends BaseService {

    protected static instance: SubscriptionService;

    private constructor() {
        super();
    }

    static getInstance() {
        if (!SubscriptionService.instance) SubscriptionService.instance = new SubscriptionService();
        return SubscriptionService.instance;
    }

    querySubscription(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<ISubscription>> {
        return this.report(this.transport.get(`/subscription-plan`, { query: this.normalizeParams(params) }));
    }

    createUserSubscription(payload: { plan_id: any, start_date: Date, end_date: Date }): Promise<SanitizedResponse<UserSubscription>> {
        return this.report(this.transport.post(`/user-subscription-plan`, payload));
    }

    queryUserSubscription(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<IUserSubscription>> {
        return this.report(this.transport.get(`/user-subscription-plan`, { query: this.normalizeParams(params) }));
    }

    createSubcriptionPayment(payload: { subscription_id: string, amount: number, payment_method: any, reference: string, user_subscription_id: string }): Promise<SanitizedResponse<Payment>> {
        return this.report(this.transport.post(`/payment`, payload));
    }

    querySubcriptionPayment(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<IPayment>> {
        return this.report(this.transport.get(`/payment`, { query: this.normalizeParams(params) }));
    }
}
