/**
 * Client network transport.
 *
 * Connects to the relay server, sends local inputs, receives remote inputs.
 */

import type { InputFrame, InputFrameMessage, ProtocolMessage } from '@kart-racer/shared';

export type InputHandler = (msg: InputFrameMessage) => void;
export type RoomCreatedHandler = (roomCode: string, seed: number, totalLaps: number) => void;
export type JoinedRoomHandler = (roomCode: string, playerIndex: number) => void;
export type PlayerJoinedHandler = (playerIndex: number) => void;
export type PlayerReadyHandler = (playerIndex: number) => void;
export type RaceStartedHandler = () => void;
export type ErrorHandler = (message: string) => void;

export class NetClient {
  private ws: WebSocket | null = null;
  private inputHandlers: InputHandler[] = [];
  private roomCreatedHandlers: RoomCreatedHandler[] = [];
  private joinedRoomHandlers: JoinedRoomHandler[] = [];
  private playerJoinedHandlers: PlayerJoinedHandler[] = [];
  private playerReadyHandlers: PlayerReadyHandler[] = [];
  private raceStartedHandlers: RaceStartedHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private connected = false;
  private roomCode: string | null = null;
  private playerIndex: number = 0;

  constructor(private url: string) {}

  connect(): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
      console.log('Connected to server');
    };

    this.ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        this.handleMessage(raw);
      } catch (err) {
        console.warn('Failed to parse message:', err);
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      console.log('Disconnected from server');
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  private handleMessage(raw: unknown): void {
    const msg = raw as any;
    if (msg.type === 'inputFrame') {
      for (const handler of this.inputHandlers) {
        handler(msg as InputFrameMessage);
      }
    } else if (msg.type === 'roomCreated') {
      this.roomCode = msg.roomCode;
      for (const handler of this.roomCreatedHandlers) {
        handler(msg.roomCode, msg.seed, msg.totalLaps ?? 3);
      }
    } else if (msg.type === 'joinedRoom') {
      this.roomCode = msg.roomCode;
      this.playerIndex = msg.playerIndex ?? 0;
      for (const handler of this.joinedRoomHandlers) {
        handler(msg.roomCode, msg.playerIndex ?? 0);
      }
    } else if (msg.type === 'raceStarted') {
      for (const handler of this.raceStartedHandlers) {
        handler();
      }
    } else if (msg.type === 'playerJoined') {
      for (const handler of this.playerJoinedHandlers) {
        handler(msg.playerIndex);
      }
    } else if (msg.type === 'playerReady') {
      for (const handler of this.playerReadyHandlers) {
        handler(msg.playerIndex);
      }
    } else if (msg.type === 'error') {
      for (const handler of this.errorHandlers) {
        handler(msg.message);
      }
    }
  }

  send(msg: ProtocolMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  createRoom(playerName: string): void {
    this.send({ type: 'createRoom', playerName });
  }

  joinRoom(roomCode: string, playerName: string): void {
    this.send({ type: 'joinRoom', roomCode, playerName });
  }

  ready(): void {
    if (this.roomCode) {
      this.send({ type: 'ready', roomCode: this.roomCode });
    }
  }

  start(): void {
    if (this.roomCode) {
      this.send({ type: 'start', roomCode: this.roomCode });
    }
  }

  sendInputFrame(tick: number, input: InputFrame): void {
    this.send({
      type: 'inputFrame',
      tick,
      playerIndex: this.playerIndex,
      input,
    });
  }

  sendHashReport(tick: number, hash: number): void {
    this.send({
      type: 'hashReport',
      tick,
      hash,
    });
  }

  onInputFrame(handler: InputHandler): void {
    this.inputHandlers.push(handler);
  }

  onRoomCreated(handler: RoomCreatedHandler): void {
    this.roomCreatedHandlers.push(handler);
  }

  onJoinedRoom(handler: JoinedRoomHandler): void {
    this.joinedRoomHandlers.push(handler);
  }

  onPlayerJoined(handler: PlayerJoinedHandler): void {
    this.playerJoinedHandlers.push(handler);
  }

  onPlayerReady(handler: PlayerReadyHandler): void {
    this.playerReadyHandlers.push(handler);
  }

  onRaceStarted(handler: RaceStartedHandler): void {
    this.raceStartedHandlers.push(handler);
  }

  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  isConnected(): boolean {
    return this.connected;
  }

  getPlayerIndex(): number {
    return this.playerIndex;
  }

  getRoomCode(): string | null {
    return this.roomCode;
  }
}
