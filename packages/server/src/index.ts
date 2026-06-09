/**
 * WebSocket relay server.
 *
 * Relays inputs only, never world state.
 * Validates every inbound message with Zod at the boundary.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { ProtocolMessage } from '@kart-racer/shared';

interface Client {
  ws: WebSocket;
  playerIndex: number;
  roomCode: string;
  ready: boolean;
}

interface Room {
  code: string;
  clients: Client[];
  host: Client | null;
  started: boolean;
  seed: number;
  totalLaps: number;
}

const rooms = new Map<string, Room>();
const clients = new Map<WebSocket, Client>();

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function broadcast(room: Room, message: object, exclude?: Client): void {
  const json = JSON.stringify(message);
  for (const client of room.clients) {
    if (client !== exclude && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(json);
    }
  }
}

export function createServer(port: number = 3000): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      try {
        const raw = JSON.parse(data.toString());
        const result = ProtocolMessage.safeParse(raw);
        if (!result.success) {
          console.warn('Invalid message:', result.error);
          return;
        }
        handleMessage(ws, result.data);
      } catch (err) {
        console.warn('Failed to parse message:', err);
      }
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      if (client) {
        leaveRoom(client);
        clients.delete(ws);
      }
    });
  });

  console.log(`Relay server listening on port ${port}`);
  return wss;
}

function handleMessage(ws: WebSocket, msg: import('@kart-racer/shared').ProtocolMessage): void {
  switch (msg.type) {
    case 'createRoom': {
      const roomCode = generateRoomCode();
      const room: Room = {
        code: roomCode,
        clients: [],
        host: null,
        started: false,
        seed: Date.now() >>> 0,
        totalLaps: 3,
      };
      rooms.set(roomCode, room);
      joinRoom(ws, room, msg.playerName);
      ws.send(JSON.stringify({ type: 'roomCreated', roomCode, seed: room.seed, totalLaps: room.totalLaps }));
      break;
    }
    case 'joinRoom': {
      const room = rooms.get(msg.roomCode);
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
        return;
      }
      if (room.clients.length >= 4) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
        return;
      }
      joinRoom(ws, room, msg.playerName);
      ws.send(JSON.stringify({ type: 'joinedRoom', roomCode: room.code, seed: room.seed, totalLaps: room.totalLaps }));
      broadcast(room, { type: 'playerJoined', playerIndex: room.clients.length - 1, playerName: msg.playerName });
      break;
    }
    case 'ready': {
      const client = clients.get(ws);
      if (!client) return;
      client.ready = true;
      const room = rooms.get(client.roomCode);
      if (room) {
        broadcast(room, { type: 'playerReady', playerIndex: client.playerIndex });
      }
      break;
    }
    case 'start': {
      const client = clients.get(ws);
      if (!client) return;
      const room = rooms.get(client.roomCode);
      if (!room || room.host !== client) return;
      room.started = true;
      broadcast(room, { type: 'raceStarted', seed: room.seed, totalLaps: room.totalLaps });
      break;
    }
    case 'inputFrame': {
      const client = clients.get(ws);
      if (!client) return;
      const room = rooms.get(client.roomCode);
      if (!room || !room.started) return;
      // Relay the input frame to all other clients
      broadcast(room, msg, client);
      break;
    }
    case 'hashReport': {
      const client = clients.get(ws);
      if (!client) return;
      const room = rooms.get(client.roomCode);
      if (!room) return;
      // Relay hash reports to all clients (for desync detection)
      broadcast(room, msg, client);
      break;
    }
    case 'sync': {
      const client = clients.get(ws);
      if (!client) return;
      const room = rooms.get(client.roomCode);
      if (!room) return;
      broadcast(room, msg, client);
      break;
    }
  }
}

function joinRoom(ws: WebSocket, room: Room, _playerName: string): void {
  const playerIndex = room.clients.length;
  const client: Client = { ws, playerIndex, roomCode: room.code, ready: false };
  room.clients.push(client);
  clients.set(ws, client);
  if (playerIndex === 0) {
    room.host = client;
  }
}

function leaveRoom(client: Client): void {
  const room = rooms.get(client.roomCode);
  if (!room) return;
  room.clients = room.clients.filter((c) => c !== client);
  if (room.clients.length === 0) {
    rooms.delete(client.roomCode);
  } else if (room.host === client) {
    room.host = room.clients[0]!;
  }
  broadcast(room, { type: 'playerLeft', playerIndex: client.playerIndex });
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createServer(Number(process.env.PORT) || 3000);
}
