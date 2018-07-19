import { RequestHandler } from 'express';
import * as asyncHandler from 'express-async-handler';
import { Config } from './config';

export class RouteDefintion {
    constructor(
        public path: string,
        public method: string,
        public handler: RequestHandler) { }
}

export class AppRoutes {
    public static getRoutes(config: Config): RouteDefintion[] {
        return [
            {
                path: '/',
                method: 'GET',
                handler: (request, response) => {
                    response.send("Drink with me, friend!");
                },
            },
        ];
    }
}
