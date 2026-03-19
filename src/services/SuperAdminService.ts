import { type NoseurObject } from "@ronuse/noseur";
import { BaseService, type SanitizedResponse } from "./BaseService";

export interface SuperAdminResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

export class SuperAdminService extends BaseService {

  protected static instance: SuperAdminService;

  private constructor() {
    super();
  }

  static getInstance() {
    if (!SuperAdminService.instance) {
      SuperAdminService.instance = new SuperAdminService();
    }
    return SuperAdminService.instance;
  }

  /**
   * Get all models available in admin
   */
  getModels(): Promise<SanitizedResponse<any>> {
    return this.report(
      this.transport.get(`/super-admin/models`)
    );
  }

  /**
   * Get model records
   */
getModelRecords(
  model: string,
  params: NoseurObject<string | number> = { page: 1, size: 10 }
): Promise<SanitizedResponse<SuperAdminResponse<any>>> {

  return this.report(
    this.transport.get(`/super-admin/${model}`, { query: this.normalizeParams(params) })
  );

}

  /**
   * Get single record
   */
  getModelRecord(
    model: string,
    id: string
  ): Promise<SanitizedResponse<any>> {

    return this.report(
      this.transport.get(`/super-admin/${model}/${id}`)
    );

  }

  /**
   * Create record
   */
  createModelRecord(
    model: string,
    payload: any
  ): Promise<SanitizedResponse<any>> {

    return this.report(
      this.transport.post(`/super-admin/${model}`, payload)
    );

  }

  /**
   * Update record
   */
  updateModelRecord(
    model: string,
    id: string,
    payload: any
  ): Promise<SanitizedResponse<any>> {

    return this.report(
      this.transport.patch(`/super-admin/${model}/${id}`, payload)
    );

  }

  /**
   * Delete record
   */
  deleteModelRecord(
    model: string,
    id: string
  ): Promise<SanitizedResponse<any>> {

    return this.report(
      this.transport.delete(`/super-admin/${model}/${id}`)
    );

  }

}