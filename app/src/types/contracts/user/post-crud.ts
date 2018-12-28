import { IPostJson } from "../../entities";

export interface ICreatePostRequest {
    title: string;
    slug: string;
    summary: string;
    body: string;
}

export interface ICreatePostResponse {
    post: IPostJson;
}

export type IUpdatePostRequest = ICreatePostRequest;

export type IUpdatePostResponse = ICreatePostResponse;
