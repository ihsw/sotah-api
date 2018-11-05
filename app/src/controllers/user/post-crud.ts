import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { Post } from "../../entities/post";
import { PostRequestBodyRules } from "../../lib/validator-rules";
import { IValidationErrorResponse } from "../../types/contracts";
import { ICreatePostRequest, ICreatePostResponse } from "../../types/contracts/user/post-crud";
import { UserLevel } from "../../types/entities";
import { IRequest, IRequestResult } from "../index";

export class PostCrudController {
    private dbConn: Connection;

    constructor(dbConn: Connection) {
        this.dbConn = dbConn;
    }

    public async createPost(req: IRequest<ICreatePostRequest>): Promise<IRequestResult<ICreatePostResponse | IValidationErrorResponse | null>> {
        const user = req.user!;
        if (user.level < UserLevel.Admin) {
            return { data: null, status: HTTPStatus.UNAUTHORIZED };
        }

        let result: ICreatePostRequest | null = null;
        try {
            result = (await PostRequestBodyRules.validate(req.body)) as ICreatePostRequest;
        } catch (err) {
            const validationErrors: IValidationErrorResponse = { [err.path]: err.message };

            return {
                data: validationErrors,
                status: HTTPStatus.BAD_REQUEST,
            };
        }

        const post = new Post();
        post.title = result.title;
        await this.dbConn.manager.save(post);

        return {
            data: { post: post.toJson() },
            status: HTTPStatus.CREATED,
        };
    };
}
