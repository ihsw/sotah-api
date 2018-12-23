import { Response } from "express";
import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { Post } from "../../entities/post";
import { PostRequestBodyRules } from "../../lib/validator-rules";
import { IValidationErrorResponse } from "../../types/contracts";
import {
    ICreatePostRequest,
    ICreatePostResponse,
    IUpdatePostRequest,
    IUpdatePostResponse,
} from "../../types/contracts/user/post-crud";
import { UserLevel } from "../../types/entities";
import { Authenticator, IRequest, IRequestResult, Validator } from "../index";

export class PostCrudController {
    private dbConn: Connection;

    constructor(dbConn: Connection) {
        this.dbConn = dbConn;
    }

    @Authenticator<ICreatePostRequest, ICreatePostResponse>(UserLevel.Admin)
    @Validator<ICreatePostRequest, ICreatePostResponse>(PostRequestBodyRules)
    public async createPost(
        req: IRequest<ICreatePostRequest>,
        _res: Response,
    ): Promise<IRequestResult<ICreatePostResponse | IValidationErrorResponse>> {
        const post = new Post();
        post.title = req.body.title;
        post.slug = req.body.slug;
        post.user = req.user!;
        post.body = req.body.body;
        await this.dbConn.manager.save(post);

        return {
            data: { post: post.toJson() },
            status: HTTPStatus.CREATED,
        };
    }

    @Authenticator<IUpdatePostRequest, IUpdatePostResponse>(UserLevel.Admin)
    @Validator<IUpdatePostRequest, IUpdatePostResponse>(PostRequestBodyRules)
    public async updatePost(
        req: IRequest<IUpdatePostRequest>,
        _res: Response,
    ): Promise<IRequestResult<IUpdatePostResponse | IValidationErrorResponse>> {
        const user = req.user!;
        const post = await this.dbConn.getRepository(Post).findOne({
            relations: ["user"],
            where: {
                id: req.params["post_id"],
            },
        });
        if (typeof post === "undefined" || post === null) {
            const validationResponse: IValidationErrorResponse = {
                notFound: "Not Found",
            };

            return {
                data: validationResponse,
                status: HTTPStatus.NOT_FOUND,
            };
        }

        if (post.user!.id !== user.id) {
            const validationResponse: IValidationErrorResponse = {
                unauthorized: "Unauthorized",
            };

            return {
                data: validationResponse,
                status: HTTPStatus.UNAUTHORIZED,
            };
        }

        post.title = req.body.title;
        post.slug = req.body.slug;
        post.body = req.body.body;
        await this.dbConn.manager.save(post);

        return {
            data: { post: post.toJson() },
            status: HTTPStatus.OK,
        };
    }

    @Authenticator<null, null>(UserLevel.Admin)
    public async deletePost(
        req: IRequest<null>,
        _res: Response,
    ): Promise<IRequestResult<null | IValidationErrorResponse>> {
        const user = req.user!;
        const post = await this.dbConn.getRepository(Post).findOne({
            relations: ["user"],
            where: {
                id: req.params["post_id"],
            },
        });
        if (typeof post === "undefined" || post === null) {
            const validationResponse: IValidationErrorResponse = {
                notFound: "Not Found",
            };

            return {
                data: validationResponse,
                status: HTTPStatus.NOT_FOUND,
            };
        }

        if (post.user!.id !== user.id) {
            const validationResponse: IValidationErrorResponse = {
                unauthorized: "Unauthorized",
            };

            return {
                data: validationResponse,
                status: HTTPStatus.UNAUTHORIZED,
            };
        }

        await this.dbConn.manager.remove(post);

        return {
            data: null,
            status: HTTPStatus.OK,
        };
    }
}
