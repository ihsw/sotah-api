import { User } from "../../entities";

export interface ICreateUserRequest {
    email: string;
    password: string;
}

export interface ICreateUserResponse {
    token: string;
    user: User;
}

export interface ILoginRequest {
    email: string;
    password: string;
}

export interface ILoginResponse {
    token: string;
}
