import { Response } from "express";
import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { Post } from "../../entities/post";
import { PostRequestBodyRules } from "../../lib/validator-rules";
import { IValidationErrorResponse } from "../../types/contracts";
import { ICreatePostRequest, ICreatePostResponse } from "../../types/contracts/user/post-crud";
import { UserLevel } from "../../types/entities";
import { Authenticator, IRequest, IRequestResult, Validator } from "../index";

export class PostCrudController {
    private dbConn: Connection;

    constructor(dbConn: Connection) {
        this.dbConn = dbConn;
    }

    @Authenticator<ICreatePostRequest, ICreatePostResponse>(UserLevel.Admin)
    @Validator<ICreatePostRequest, ICreatePostResponse>(PostRequestBodyRules)
    public async createPost(req: IRequest<ICreatePostRequest>, _res: Response): Promise<IRequestResult<ICreatePostResponse | IValidationErrorResponse>> {
        const post = new Post();
        post.title = req.body.title;
        await this.dbConn.manager.save(post);

        return {
            data: { post: post.toJson() },
            status: HTTPStatus.CREATED,
        };
    };
}
