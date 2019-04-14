import { Request, Response } from "express";
import * as HTTPStatus from "http-status";
import { ObjectSchema } from "yup";

import { User } from "../entities/user";
import { IValidationErrorResponse } from "../types/contracts";
import { UserLevel } from "../types/entities";
export { DataController } from "./data";

export interface IRequest<T> extends Request {
    body: T;
    user?: User;
    params: {
        [key: string]: string;
    };
}

export interface IQueryRequest<T, Q> extends Request {
    body: T;
    user?: User;
    params: {
        [key: string]: string;
    };
    query: Q;
}

export interface IRequestResult<T> {
    status: number;
    data: T;
}

export type RequestHandler<T, A> = (req: IRequest<T>, res: Response) => Promise<IRequestResult<A>>;

export type QueryRequestHandler<T, Q, A> = (req: IQueryRequest<T, Q>, res: Response) => Promise<IRequestResult<A>>;

export async function handle<T, A>(handlerFunc: RequestHandler<T, A>, req: IRequest<T>, res: Response) {
    const { status, data } = await handlerFunc(req, res);
    res.status(status).send(data);
}

interface IManualValidatorResult<T> {
    req?: IRequest<T>;
    errorResult?: IRequestResult<IValidationErrorResponse>;
}

export async function ManualValidator<T extends object>(
    req: IRequest<T>,
    schema: ObjectSchema<T>,
): Promise<IManualValidatorResult<T>> {
    let result: T | null = null;
    try {
        result = (await schema.validate(req.body)) as T;
    } catch (err) {
        const validationErrors: IValidationErrorResponse = { [err.path]: err.message };

        return {
            errorResult: { data: validationErrors, status: HTTPStatus.BAD_REQUEST },
        };
    }

    req.body = result!;

    return { req };
}

type ControllerDescriptor<T, A> = (
    req: IRequest<T>,
    res: Response,
) => Promise<IRequestResult<A | IValidationErrorResponse>>;

export function Validator<T extends object, A>(schema: ObjectSchema<T>) {
    return function validatorCallable(
        _target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<ControllerDescriptor<T, A>>,
    ) {
        const originalMethod = descriptor.value!;

        descriptor.value = async function(req, res): Promise<IRequestResult<A | IValidationErrorResponse>> {
            let result: T | null = null;
            try {
                result = (await schema.validate(req.body)) as T;
            } catch (err) {
                const validationErrors: IValidationErrorResponse = { [err.path]: err.message };

                return {
                    data: validationErrors,
                    status: HTTPStatus.BAD_REQUEST,
                };
            }

            req.body = result!;

            /* tslint:disable-next-line:no-invalid-this */
            return originalMethod.apply(this, [req, res]);
        };

        return descriptor;
    };
}

export function Authenticator<T, A>(requiredLevel: UserLevel) {
    return function authenticatorCallable(
        _target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<ControllerDescriptor<T, A>>,
    ) {
        const originalMethod = descriptor.value!;

        descriptor.value = async function(req, res): Promise<IRequestResult<A | IValidationErrorResponse>> {
            const user = req.user;
            if (typeof user === "undefined" || user === null) {
                const validationErrors: IValidationErrorResponse = { unauthorized: "Unauthorized" };

                return { data: validationErrors, status: HTTPStatus.UNAUTHORIZED };
            }

            if (user.level < requiredLevel) {
                const validationErrors: IValidationErrorResponse = { unauthorized: "Unauthorized" };

                return { data: validationErrors, status: HTTPStatus.UNAUTHORIZED };
            }

            /* tslint:disable-next-line:no-invalid-this */
            return originalMethod.apply(this, [req, res]);
        };

        return descriptor;
    };
}
