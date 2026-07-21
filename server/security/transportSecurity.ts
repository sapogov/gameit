import { createServer as createHttpServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import { createServer as createHttpsServer, type ServerOptions } from 'node:https';
import { readFileSync } from 'node:fs';
import { isIP } from 'node:net';
import { WebSocketTransport } from 'colyseus';

export type ProductionTransport = { kind: 'direct-tls'; options: ServerOptions } | { kind: 'trusted-proxy'; trustedProxyIps: ReadonlySet<string>; publicOrigin: URL } | { kind: 'development' };

/** Production accepts only HTTPS at the public boundary: TLS locally or an exact trusted proxy. */
export function loadProductionTransport(env: NodeJS.ProcessEnv = process.env): ProductionTransport {
  if (env.NODE_ENV !== 'production') return { kind: 'development' };
  const origin = parsePublicOrigin(env.GAMEIT_PUBLIC_ORIGIN);
  const cert = env.GAMEIT_TLS_CERT_PATH; const key = env.GAMEIT_TLS_KEY_PATH; const proxies = env.GAMEIT_TRUSTED_PROXY_IPS;
  if (cert || key) {
    if (!cert || !key || proxies) throw new Error('Configure exactly direct TLS cert+key or trusted proxy IPs');
    return { kind: 'direct-tls', options: { cert: readFileSync(cert), key: readFileSync(key) } };
  }
  if (!proxies) throw new Error('Production requires direct TLS cert+key or GAMEIT_TRUSTED_PROXY_IPS');
  const trustedProxyIps = new Set(proxies.split(',').map((ip) => ip.trim()).filter(Boolean));
  if (!trustedProxyIps.size || [...trustedProxyIps].some((ip) => isIP(ip) === 0)) throw new Error('GAMEIT_TRUSTED_PROXY_IPS must be an exact IP allowlist');
  return { kind: 'trusted-proxy', trustedProxyIps, publicOrigin: origin };
}

export function isTrustedProxyRequest(request: IncomingMessage, transport: ProductionTransport): boolean {
  if (transport.kind !== 'trusted-proxy') return true;
  const ip = request.socket.remoteAddress?.replace(/^::ffff:/, '');
  const proto = request.headers['x-forwarded-proto']; const host = request.headers['x-forwarded-host'];
  return Boolean(ip && transport.trustedProxyIps.has(ip) && proto === 'https' && host === transport.publicOrigin.host);
}

/** Creates the Colyseus transport without claiming any HTTP route before its Express app is installed. */
export function createSecureWebSocketTransport(transport: ProductionTransport): WebSocketTransport {
  if (transport.kind === 'direct-tls') return new WebSocketTransport({ server: createHttpsServer(transport.options) });
  if (transport.kind === 'development') return new WebSocketTransport({ server: createHttpServer() });
  const server = createHttpServer();
  // Register before the transport: rejected upgrades cannot linger for another listener.
  server.on('upgrade', (request, socket) => { if (!isTrustedProxyRequest(request, transport)) socket.destroy(); });
  const websocket = new WebSocketTransport({ noServer: true });
  websocket.attachToServer(server as HttpServer, { filter: (request) => isTrustedProxyRequest(request, transport) });
  return websocket;
}

/** Must be installed first so Colyseus matchmaking never sees an untrusted HTTP request. */
export function installTrustedProxyHttpGuard(websocket: WebSocketTransport, transport: ProductionTransport): void {
  if (transport.kind !== 'trusted-proxy') return;
  websocket.getExpressApp().use((request: IncomingMessage, response: ServerResponse, next: () => void) => {
    if (isTrustedProxyRequest(request, transport)) return next();
    response.statusCode = 400;
    response.end('Secure transport required');
  });
}

function parsePublicOrigin(raw: string | undefined): URL {
  if (!raw) throw new Error('GAMEIT_PUBLIC_ORIGIN is required in production');
  let origin: URL;
  try { origin = new URL(raw); } catch { throw new Error('GAMEIT_PUBLIC_ORIGIN must be an HTTPS origin'); }
  if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) throw new Error('GAMEIT_PUBLIC_ORIGIN must be an origin-only HTTPS URL');
  return origin;
}
