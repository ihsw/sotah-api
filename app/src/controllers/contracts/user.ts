export interface ICreateUserRequest {
    email: string;
    password: string;
}

export interface ICreateUserResponse {
    token: string;
}

export interface ILoginRequest {
    email: string;
    password: string;
}

export interface ILoginResponse {
    token: string;
}
