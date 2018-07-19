import * as express from 'express';
import * as cors from 'cors';
import { Config } from './config';
import { AppRoutes } from './routes';

export class Server {
    private _app = express();

    constructor(private _config: Config) { }

    public start() {
        this._app = express();
        this._app.use(cors({ origin: true }));

        for (const route of AppRoutes.getRoutes(this._config)) {
            this._app.get(route.path, route.handler);
        }

        this._app.listen(this._config.port, () => console.log(`API is up on ${this._config.port}.`));
    }
}