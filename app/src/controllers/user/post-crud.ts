import * as HTTPStatus from "http-status";

import { Post } from "../../entities/post";
import { IValidationErrorResponse } from "../../types/contracts";
import { ICreatePostRequest, ICreatePostResponse } from "../../types/contracts/user/post-crud";
import { RequestHandler } from "../index";

export class PostCrudController {
    public createPost: RequestHandler<
        ICreatePostRequest,
        ICreatePostResponse | IValidationErrorResponse
    > = async () => {
        const post = new Post();
        post.id = -1;

        return {
            data: { post: post.toJson() },
            status: HTTPStatus.INTERNAL_SERVER_ERROR,
        };
    };
}
