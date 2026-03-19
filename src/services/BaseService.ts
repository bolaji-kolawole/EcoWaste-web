
import { LzEncryptor } from "../utils/Encryptor";
import { CacheManager } from "../utils/CacheManager";
import { DateHelper, MessageSchemesIcons, type NoseurObject, Scheme, Toaster, TypeChecker } from "@ronuse/noseur";
import ffs, { Ffs, Interceptor, LocalStorageCacheManager, RequestProcessor, RequestType, Utils as KyofuucUtils, ResponseProcessor, type HttpConfig, type KyofuucObject } from "kyofuuc";

export interface ApiResponseData<T> {
    data?: T;
    content?: T[];
    size?: number;
    transformed?: any;
    total_pages?: number;
    total_elements?: number;
    number_of_elements?: number;
    pageable?: {
        paged: boolean;
        offset: number;
        page_size: number;
        page_number: number;
    };
};

export interface ApiResponse<T> {
    message: string;
    success: boolean;
    data?: T & ApiResponseData<T>;
    secondary_data: NoseurObject<any>;
};

export type SanitizedResponse<T> = {
    data: any;
    sanitized: T;
    content: T[];
    status: number;
    errors?: any[];
    errorMessage: string;
    apiResponse: ApiResponse<T>;
};

export class BaseService {

    // remove /json route after add formData submission on kyofuuc, and remove the headers this.config
    transport: Ffs;
    interceptor = new Interceptor();
    baseUrl: string = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:9900";
    cacheManager = new LocalStorageCacheManager({
        encryptKey: true,
        encryptor: LzEncryptor,
    });

    constructor(baseUrl?: string) {
        this.transport = ffs.init({
            promiscuous: true,
            interceptor: this.interceptor,
            cacheManager: this.cacheManager,
            baseUrl: baseUrl ?? this.baseUrl,
            cacheLifetime: 1000 * 60 * 60 * 24, // 24 hours
            querySerializer: (query: KyofuucObject<any>) => {
                let serializedQuery: string = "";
                let queryParts: string[] = [];
                KyofuucUtils.forEach(query, function serialize(key: string, value: any) {
                    if (value === null || typeof value === 'undefined') {
                        return;
                    }
                    if (KyofuucUtils.isArray(value)) {
                        key = key;
                    } else {
                        value = [value];
                    }

                    KyofuucUtils.forEach(value, function parseValue(_: string, val: any) {
                        if (KyofuucUtils.isDate(val)) {
                            val = val.toISOString();
                        } else if (KyofuucUtils.isObject(val)) {
                            val = KyofuucUtils.safeStringify(val);
                        }
                        queryParts.push(`${KyofuucUtils.encodeParamURI(key)}=${KyofuucUtils.encodeParamURI(val)}`);
                    });
                    serializedQuery = queryParts.join('&');
                });
                return serializedQuery;
            }
        });
        this.interceptor.registerPreRequest((config?: HttpConfig) => {
            const accessToken = CacheManager.get(CacheManager.ACCESS_TOKEN_KEY);
            config!.headers = {
                ...config?.headers,
                Authorization: `Bearer ${accessToken}`
            };
        });
    }

    normalizeParams(params: NoseurObject<any>) {
        if (!params.page) params.page = 1;
        if (!params.size) params.size = 10;
        if (!params.sort) params.sort = "id,DESC";
        Object.keys(params).forEach((key: string) => {
            const value = params[key];
            if (!TypeChecker.isArray(value)) return;
            /*params[key] = value.reduce((acc: string, v: string, index: number) => {
                if (index > 0) return `${acc}\n${key}=${v}`;
                return `${v}`;
            }, "");*/
        });
        return params;
    }

    private handleResolve<T>(response: T, resolve: Function, postResolve?: Function) {
        let transformedResponse = this.buildResponse(response);
        postResolve?.(transformedResponse);
        resolve(transformedResponse);
    }

    private handleReject(transformedError: any, reject: Function, postReject?: Function) {
        postReject?.(transformedError);
        reject(transformedError);
    }

    report<T>(promise: Promise<any>, postResolve?: Function, postReject?: Function): Promise<SanitizedResponse<any>> {
        return new Promise((resolve, reject) => {
            promise.then((response: T) => {
                this.handleResolve(response, resolve, postResolve);
            }).catch((error: any) => {
                let transformedError = this.buildError(error);
                if (error.response?.status === 401) {
                    this.report(this.transport.post((import.meta.env.VITE_LANUARIUS_BASE_API_URL ?? "http://127.0.0.1:9001") + "/janus/lanuarius/api/v1/user/auth/refresh", {
                        authenticating_platform: "ecowaste",
                        access_token: CacheManager.get(CacheManager.ACCESS_TOKEN_KEY),
                        session_token: CacheManager.get(CacheManager.SESSION_TOKEN_KEY),
                    }), ({ sanitized }: SanitizedResponse<any>) => {
                        CacheManager.insecurePut(CacheManager.ACCESS_TOKEN_KEY, sanitized.access_token);
                        promise.then((response: T) => {
                            this.handleResolve(response, resolve, postResolve);
                        }).catch(async (error: any) => {
                            this.handleReject(this.buildError(error), reject, postReject);
                        });
                    }).catch(() => {
                        alert("Signin");
                        CacheManager.clear();
                    });
                    return;
                }
                this.handleReject(transformedError, reject, postReject);
            });
        });
    }

    buildResponse<T>(response: any): SanitizedResponse<T> {
        if (!response.data) return response;
        response.status = response?.status;
        response.apiResponse = response.data;
        response.sanitized = response.apiResponse?.data;
        response.content = response.apiResponse?.data?.content;
        return response;
    }

    buildError<T>(error: any): SanitizedResponse<T> {
        if (!error) error = {};
        error.message = error?.response?.data?.message ?? error?.response?.message ?? error?.data?.message ?? error?.message ?? "An error occur please try again later";
        error.errors = error?.response?.data?.errors;
        error.errorMessage = error.message;
        error.status = error.response?.status ?? -1;
        return error;
    }

    getIdealStatQueryForDateRange(startDate: string, endDate: string) {
        let labelKey = "hour";
        let graphDataKey = "hours";
        const supplementParams: NoseurObject<any> = {
            updated_at_to: endDate,
            updated_at_from: startDate,
            "stat.query.fetch_hourly": false,
            "stat.query.fetch_yearly": false,
            "stat.query.fetch_monthly": false,
            "stat.query.fetch_previous": false,
            "stat.query.fetch_week_days": false,
            "stat.query.fetch_month_days": false,
        };
        const daysDifference = DateHelper.getDaysBetweenDates(new Date(startDate), new Date(endDate));
        if (daysDifference <= 7) { // week
            labelKey = "week_day";
            graphDataKey = "week_days";
            supplementParams["stat.query.fetch_week_days"] = true;
        } else if (daysDifference <= 31) { // days
            labelKey = "day_of_month";
            graphDataKey = "month_days";
            supplementParams["stat.query.fetch_month_days"] = true;
        } else if (daysDifference <= 365) { // months
            labelKey = "month";
            graphDataKey = "months";
            supplementParams["stat.query.fetch_monthly"] = true;
        } else { // years
            labelKey = "year";
            graphDataKey = "years";
            supplementParams["stat.query.fetch_yearly"] = true;
        }
        return { supplementParams, graphDataKey, labelKey };
    }

    mockResolve(timeout: number, response: any, postResolve?: Function, postReject?: Function): Promise<any> {
        return this.report(new Promise((resolve, _) => {
            setTimeout(() => resolve(response), timeout);
        }), postResolve, postReject);
    }

    mockReject(timeout: number, error: any, postResolve?: Function, postReject?: Function): Promise<any> {
        return this.report(new Promise((_, reject) => {
            setTimeout(() => reject(error), timeout);
        }), postResolve, postReject);
    }

    static reportError<T>(response: SanitizedResponse<T>) {
        Toaster.toast({
            lifetime: 5000,
            foreScheme: true,
            scheme: Scheme.DANGER,
            showProgressbar: true,
            pauseDelayOnHover: true,
            style: { background: "white" },
            icon: MessageSchemesIcons.INFO,
            content: (response.errors?.length ? response.errors.join("\n") : response?.errorMessage ?? `${response}`),
        });
    }

}

RequestProcessor.register(RequestType.JSON, (data: object) => {
    return {
        contentType: "application/json",
        buffer: KyofuucUtils.safeStringify(data),
    } as any;
});

// todo handle responseType: "noContent"
ResponseProcessor.register("NOCONTENT", (_: any) => {
    return {
        contentType: "noContent",
        buffer: "",
    } as any;
});
