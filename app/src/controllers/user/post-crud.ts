import * as HTTPStatus from "http-status";

import { Post } from "../../entities/post";
import { IValidationErrorResponse } from "../../types/contracts";
import { ICreatePostRequest, ICreatePostResponse } from "../../types/contracts/user/post-crud";
import { UserLevel } from "../../types/entities";
import { RequestHandler } from "../index";

export class PostCrudController {
    public createPost: RequestHandler<
        ICreatePostRequest,
        ICreatePostResponse | IValidationErrorResponse | null
    > = async req => {
        const user = req.user!;
        if (user.level < UserLevel.Admin) {
            return { data: null, status: HTTPStatus.UNAUTHORIZED };
        }

        const post = new Post();
        post.id = -1;

        return {
            data: { post: post.toJson() },
            status: HTTPStatus.INTERNAL_SERVER_ERROR,
        };
    };
}
