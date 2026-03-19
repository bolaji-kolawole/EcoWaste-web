import { UserService } from "./UserService";
import { IRole, RoleService } from "./RoleService";
import { User } from "../types";
import { IAddress, AddressService } from "./AddressService";
import { ISubscription, SubscriptionService, IUserSubscription, IPayment } from "./SubscriptionService";
import { IRecyclingCompany, RecyclingCompany, WasteRequest, WasteRequestService, WasteType } from "./WasteRequestService";

const userService = UserService.getInstance();
const roleService = RoleService.getInstance();
const addressService = AddressService.getInstance();
const subscriptionService = SubscriptionService.getInstance();
const wasteRequestService = WasteRequestService.getInstance();

export async function getUsers(): Promise<User[]> {
    const fetchUser = (await userService.queryUsers()).sanitized;
    const users: any = fetchUser.rows
    return users;
}

export async function getRoles(): Promise<IRole[]> {
    const fetchRole = (await roleService.queryRoles()).sanitized;
    const roles: any = fetchRole.content;
    return roles;
}

export async function getAddresses(): Promise<IAddress[]> {
    const fetchAddress = (await addressService.queryAddresss()).sanitized;
    const address: any = fetchAddress.content
    return address;
}

export async function getSubscriptionPlans(): Promise<ISubscription[]> {
    const fetchSubscription = (await subscriptionService.querySubscription()).sanitized;
    const subscription: any = fetchSubscription.content
    return subscription;
}

export async function getUserSubscriptions(): Promise<IUserSubscription[]> {
    const fetchUserSubscription = (await subscriptionService.queryUserSubscription()).sanitized;
    const userSubscription: any = fetchUserSubscription.content
    return userSubscription;
}

export async function getPayments(): Promise<IPayment[]> {
    const fetchPayment = (await subscriptionService.querySubcriptionPayment()).sanitized;
    const payment: any = fetchPayment.content;
    return payment
}

export async function getWasteTypes(): Promise<WasteType[]> {
    const fetchWasteType = (await wasteRequestService.queryWasteTypes()).sanitized;
    const wasteType = fetchWasteType.content;
    return wasteType;
}

export async function getWasteRequests(): Promise<WasteRequest[]> {
    const fetchWasteRequets = (await wasteRequestService.queryWasteRequests()).sanitized;
    const wasteRequest = fetchWasteRequets.content;
    return wasteRequest;
}

export async function getRecyclingCompanies(): Promise<RecyclingCompany[]> {
    const fetchCompany = (await wasteRequestService.queryRecyclingCompany()).sanitized;
    const company = fetchCompany.content
    return company;
}

