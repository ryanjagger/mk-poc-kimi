/**
 * Client network transport.
 *
 * Connects to the relay server, sends local inputs, receives remote inputs.
 */

import type { InputFrame, InputFrameMessage, ProtocolMessage } from '@kart-racer/shared';

export type InputHandler = (msg: InputFrameMessage) => void;

export class NetClient {
  private ws: WebSocket | null = null;
  private inputHandlers: InputHandler[] = [];
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
    const msg = raw as ProtocolMessage;
    if (msg.type === 'inputFrame') {
      for (const handler of this.inputHandlers) {
        handler(msg);
      }
    } else if (msg.type === 'roomCreated') {
      this.roomCode = (msg as any).roomCode;
      console.log('Room created:', this.roomCode);
    } else if (msg.type === 'joinedRoom') {
      this.roomCode = (msg as any).roomCode;
      this.playerIndex = (msg as any).playerIndex ?? 0;
      console.log('Joined room:', this.roomCode, 'playerIndex:', this.playerIndex);
    } else if (msg.type === 'raceStarted') {
      console.log('Race started!');
    } else if (msg.type === 'playerJoined') {
      console.log('Player joined:', (msg as any).playerIndex);
    } else if (msg.type === 'playerReady') {
      console.log('Player ready:', (msg as any).playerIndex);
    } else if (msg.type === 'error') {
      console.error('Server error:', (msg as any).message);
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

  isConnected(): boolean {
    return this.connected;
  }

  getPlayerIndex(): number {
    return this.playerIndex;
  }
}
