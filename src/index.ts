import { Config } from './config';
import { Server } from './server';

const server = new Server(new Config());
server.start();