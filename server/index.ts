import { Server } from 'colyseus';
import { BattleRoom } from './rooms/BattleRoom';
import { LocationRoom } from './rooms/LocationRoom';
import { AccountRoom } from './rooms/AccountRoom';
import './authority/runtime';
import { createSecureWebSocketTransport, installTrustedProxyHttpGuard, loadProductionTransport } from './security/transportSecurity';

const port = Number(process.env.MONSTER_RPG_SERVER_PORT ?? 2567);
const host = process.env.MONSTER_RPG_SERVER_HOST ?? '127.0.0.1';
const transport = loadProductionTransport();
const websocketTransport = createSecureWebSocketTransport(transport);
installTrustedProxyHttpGuard(websocketTransport, transport);
const gameServer = new Server({ transport: websocketTransport });

gameServer.define('account', AccountRoom);
gameServer.define('location', LocationRoom).filterBy(['mapId']);
gameServer.define('home_village', LocationRoom).filterBy(['mapId']);
gameServer.define('battle', BattleRoom).filterBy(['battleId']);

await gameServer.listen(port, host);

const publicAddress = transport.kind === 'trusted-proxy'
  ? transport.publicOrigin.origin
  : `${transport.kind === 'direct-tls' ? 'https' : 'http'}://${host}:${port}`;
console.log(`[monster-rpg] Colyseus server listening at ${publicAddress}`);
