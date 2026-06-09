import { describe, it, expect } from 'vitest';
import { WebSocket } from 'ws';
import { createServer } from './index.js';

describe('Server relay', () => {
  it('relays input frames between two clients', async () => {
    const server = createServer(3456);
    await new Promise((resolve) => server.on('listening', resolve));

    const client1 = new WebSocket('ws://localhost:3456');
    const client2 = new WebSocket('ws://localhost:3456');

    await Promise.all([
      new Promise((resolve) => client1.on('open', resolve)),
      new Promise((resolve) => client2.on('open', resolve)),
    ]);

    // Create room
    client1.send(JSON.stringify({ type: 'createRoom', playerName: 'Player1' }));
    const roomMsg: any = await new Promise((resolve) => {
      client1.once('message', (data) => resolve(JSON.parse(data.toString())));
    });
    expect(roomMsg.type).toBe('roomCreated');
    const roomCode = roomMsg.roomCode;

    // Join room
    client2.send(JSON.stringify({ type: 'joinRoom', roomCode, playerName: 'Player2' }));
    const joinMsg: any = await new Promise((resolve) => {
      client2.once('message', (data) => resolve(JSON.parse(data.toString())));
    });
    expect(joinMsg.type).toBe('joinedRoom');

    // Ready up
    client1.send(JSON.stringify({ type: 'ready', roomCode }));
    client2.send(JSON.stringify({ type: 'ready', roomCode }));

    // Start race
    client1.send(JSON.stringify({ type: 'start', roomCode }));
    const startMsg: any = await new Promise((resolve) => {
      const handler = (data: any) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'raceStarted') {
          client1.off('message', handler);
          resolve(msg);
        }
      };
      client1.on('message', handler);
    });
    expect(startMsg.type).toBe('raceStarted');

    // Send input frame from client1
    client1.send(JSON.stringify({
      type: 'inputFrame',
      tick: 0,
      playerIndex: 0,
      input: { accelerate: true, brake: false, steerLeft: false, steerRight: false, drift: false },
    }));

    // Client2 should receive the relayed input
    const relayed: any = await new Promise((resolve) => {
      const handler = (data: any) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'inputFrame') {
          client2.off('message', handler);
          resolve(msg);
        }
      };
      client2.on('message', handler);
    });
    expect(relayed.type).toBe('inputFrame');
    expect(relayed.tick).toBe(0);
    expect(relayed.playerIndex).toBe(0);

    client1.close();
    client2.close();
    server.close();
  });
});
