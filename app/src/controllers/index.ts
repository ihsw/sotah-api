import { Request, Response } from "express";

import { User } from "../entities/user";
export { DataController } from "./data";

export interface IRequest<T> extends Request {
    body: T;
    user?: User;
    params: {
        [key: string]: string;
    };
}

export interface IRequestResult<T> {
    status: number;
    data: T;
}

export type RequestHandler<T, A> = (req: IRequest<T>, res: Response) => Promise<IRequestResult<A>>;

export async function handle<T, A>(handlerFunc: RequestHandler<T, A>, req: IRequest<T>, res: Response) {
    const { status, data } = await handlerFunc(req, res);
    res.status(status).send(data);
}
