
import { type NoseurObject } from "@ronuse/noseur";
import { BaseService, type SanitizedResponse } from "./BaseService";


export interface Notification {
    title: string;
    message: string;
    type: string;
    recipient_id: string;
    recipient_role: string;
    external_id: string;
    read: boolean;
    created_at: Date;
}

export interface INotification {
    content: Notification[];
}


export class NotificationService extends BaseService {

    protected static instance: NotificationService;

    private constructor() {
        super();
    }

    static getInstance() {
        if (!NotificationService.instance) NotificationService.instance = new NotificationService();
        return NotificationService.instance;
    }

    queryNotifications(params: NoseurObject<string | number> = { page: 1, size: 10 }): Promise<SanitizedResponse<INotification>> {
        return this.report(this.transport.get(`/notification`, { query: this.normalizeParams(params) }));
    }

    createUserNotification(payload: { title: string, message: string, type: string, recipient_id: string, recipient_role: string, }): Promise<SanitizedResponse<Notification>> {
        return this.report(this.transport.post(`/notification`, payload));
    }

    markNotificationAsRead(external_id: string, payload: { read: boolean }): Promise<SanitizedResponse<Notification>> {
        return this.report(this.transport.patch(`/notification/${external_id}`, payload));
    }
}
