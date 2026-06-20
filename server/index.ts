import { Server } from 'colyseus';
import { LocationRoom } from './rooms/LocationRoom';

const port = Number(process.env.MONSTER_RPG_SERVER_PORT ?? 2567);
const host = process.env.MONSTER_RPG_SERVER_HOST ?? '127.0.0.1';
const gameServer = new Server();

gameServer.define('location', LocationRoom).filterBy(['mapId']);
gameServer.define('home_village', LocationRoom).filterBy(['mapId']);

await gameServer.listen(port, host);

console.log(`[monster-rpg] Colyseus server listening on http://${host}:${port}`);
