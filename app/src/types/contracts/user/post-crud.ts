import { IPostJson } from "../../entities";

export interface ICreatePostRequest {
    title: string;
}

export interface ICreatePostResponse {
    post: IPostJson;
}
