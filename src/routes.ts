import { RequestHandler } from 'express';
import * as asyncHandler from 'express-async-handler';
import { Config } from './config';
import { DatabaseService } from './services/database.service';

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
                path: '/card/random',
                method: 'GET',
                handler: asyncHandler(async (req, res) => {
                    const dataService = await DatabaseService.create(config);
                    const card = await dataService.getRandomCard();

                    if (card) {
                        res.type('application/json');
                        res.send(card);
                    } else {
                        res.sendStatus(500);
                    }
                }),
            },
            {
                path: '/card/:cardId',
                method: 'GET',
                handler: asyncHandler(async (req, res) => {
                    const dataService = await DatabaseService.create(config);
                    const card = await dataService.getCard(req.params.cardId);

                    if (card) {
                        res.type('application/json');
                        res.send(card);
                    }
                    else {
                        res.sendStatus(404);
                    }
                }),
            },
            {
                path: '/cards/search/:query',
                method: 'GET',
                handler: asyncHandler(async (req, res) => {
                    const dataService = await DatabaseService.create(config);
                    const results = await dataService.search(req.params.query);

                    if (results) {
                        res.type('application/json');
                        res.send(results);
                    }
                    else {
                        res.sendStatus(404);
                    }
                }),
            },
            {
                path: '/external-info-providers/:cardId',
                method: 'GET',
                handler: asyncHandler(async (req, res) => {
                    const dataService = await DatabaseService.create(config);
                    const card = await dataService.getCard(req.params.cardId);

                    if (!card) {
                        res.sendStatus(404);
                    } else {
                        const externalProviders = await dataService.getExternalInfoProviders(card);

                        res.type('application/json');
                        res.send(externalProviders);
                    }
                }),
            },
            {
                path: '/factions',
                method: 'GET',
                handler: asyncHandler(async (req, res) => {
                    const dataService = await DatabaseService.create(config);
                    const factions = await dataService.getFactions();

                    res.type('application/json');
                    res.send(factions);
                }),
            },
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
