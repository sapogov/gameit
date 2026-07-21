import { describe, expect, test } from 'vitest';
import { connect } from 'node:net';
import { Server as HttpsServer } from 'node:https';
import { createSecureWebSocketTransport, installTrustedProxyHttpGuard, loadProductionTransport, isTrustedProxyRequest } from './transportSecurity';

describe('production transport security', () => {
  test('requires exact production mode and validates IP allowlists', () => {
    expect(() => loadProductionTransport({ NODE_ENV: 'production' })).toThrow();
    expect(() => loadProductionTransport({ NODE_ENV: 'production', GAMEIT_PUBLIC_ORIGIN: 'http://game.example', GAMEIT_TRUSTED_PROXY_IPS: '127.0.0.1' })).toThrow();
    expect(() => loadProductionTransport({ NODE_ENV: 'production', GAMEIT_PUBLIC_ORIGIN: 'https://game.example', GAMEIT_TRUSTED_PROXY_IPS: '*' })).toThrow();
    expect(loadProductionTransport({ NODE_ENV: 'test' })).toMatchObject({ kind: 'development' });
  });
  test('accepts only exact proxy source, forwarded proto, and forwarded host for HTTP and upgrade predicates', () => {
    const transport = loadProductionTransport({ NODE_ENV: 'production', GAMEIT_PUBLIC_ORIGIN: 'https://game.example', GAMEIT_TRUSTED_PROXY_IPS: '10.0.0.2,::1' });
    const request = (ip: string, headers: Record<string, string>) => ({ socket: { remoteAddress: ip }, headers }) as never;
    expect(isTrustedProxyRequest(request('::ffff:10.0.0.2', { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'game.example' }), transport)).toBe(true);
    expect(isTrustedProxyRequest(request('10.0.0.3', { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'game.example' }), transport)).toBe(false);
    expect(isTrustedProxyRequest(request('10.0.0.2', { 'x-forwarded-proto': 'http', 'x-forwarded-host': 'game.example' }), transport)).toBe(false);
  });
  test('constructs an HTTPS server for direct TLS mode', () => {
    const websocket = createSecureWebSocketTransport({ kind: 'direct-tls', options: {} });
    expect(websocket.server).toBeInstanceOf(HttpsServer);
    websocket.shutdown();
  });
  test('rejects an untrusted proxy HTTP request before Colyseus routes', async () => {
    const transport = loadProductionTransport({ NODE_ENV: 'production', GAMEIT_PUBLIC_ORIGIN: 'https://game.example', GAMEIT_TRUSTED_PROXY_IPS: '127.0.0.1' });
    const websocket = createSecureWebSocketTransport(transport); installTrustedProxyHttpGuard(websocket, transport);
    const server = websocket.server!;
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address(); if (!address || typeof address === 'string') throw new Error('missing test address');
    try {
      const rejected = await fetch(`http://127.0.0.1:${address.port}/matchmake/joinById`);
      const accepted = await fetch(`http://127.0.0.1:${address.port}/matchmake/joinById`, { headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'game.example' } });
      expect(rejected.status).toBe(400); expect(accepted.status).not.toBe(400);
    } finally { websocket.shutdown(); await new Promise<void>((resolve) => server.close(() => resolve())); }
  });
  test('rejects untrusted WebSocket upgrades and accepts trusted proxy upgrades', async () => {
    const transport = loadProductionTransport({ NODE_ENV: 'production', GAMEIT_PUBLIC_ORIGIN: 'https://game.example', GAMEIT_TRUSTED_PROXY_IPS: '127.0.0.1' });
    const websocket = createSecureWebSocketTransport(transport); installTrustedProxyHttpGuard(websocket, transport);
    const server = websocket.server!;
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address(); if (!address || typeof address === 'string') throw new Error('missing test address');
    try {
      expect(await rawUpgrade(address.port, false)).not.toContain('101 Switching Protocols');
      expect(await rawUpgrade(address.port, true)).toContain('101 Switching Protocols');
    } finally { websocket.shutdown(); await new Promise<void>((resolve) => server.close(() => resolve())); }
  });
});

function rawUpgrade(port: number, trusted: boolean): Promise<string> {
  return new Promise((resolve) => {
    const socket = connect(port, '127.0.0.1');
    let response = '';
    const finish = () => { socket.destroy(); resolve(response); };
    socket.setTimeout(1_000, finish);
    socket.on('error', finish);
    socket.on('data', (chunk) => { response += chunk.toString(); if (response.includes('\r\n\r\n')) finish(); });
    socket.on('close', () => resolve(response));
    socket.on('connect', () => socket.write([
      'GET / HTTP/1.1',
      'Host: 127.0.0.1',
      'Upgrade: websocket',
      'Connection: Upgrade',
      'Sec-WebSocket-Version: 13',
      'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==',
      ...(trusted ? ['X-Forwarded-Proto: https', 'X-Forwarded-Host: game.example'] : []),
      '', ''
    ].join('\r\n')));
  });
}
