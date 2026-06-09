import * as THREE from 'three';
import { initRenderer, getScene } from './renderer';
import { initInput } from './input';
import { NetClient } from './net';
import { createUIOverlay, showMenu, showLobby, showRaceHUD, showResults } from './ui';
import { startRace, gameLoop } from './game';
import { createTrackMeshes } from './track-render';
import { createKartMesh } from './kart-render';
import { createOvalTrack } from '@kart-racer/sim';

const SERVER_URL = 'wss://server-production-4c14.up.railway.app';

let netClient: NetClient;
let gameState: 'menu' | 'lobby' | 'racing' | 'results' = 'menu';
let playerCount = 0;
let readyPlayers = new Set<number>();
let roomCode: string | null = null;
let playerIndex = 0;
let totalLaps = 3;
let raceSeed = 0;
let track = createOvalTrack();
let isHost = false;

function init(): void {
  initRenderer();
  initInput();
  createUIOverlay();
  showMenu(onCreateRoom, onJoinRoom);
}

function onCreateRoom(playerName: string): void {
  netClient = new NetClient(SERVER_URL);
  
  netClient.onRoomCreated((code, seed, laps) => {
    roomCode = code;
    raceSeed = seed;
    totalLaps = laps;
    playerIndex = 0;
    playerCount = 1;
    isHost = true;
    gameState = 'lobby';
    showLobbyUI();
  });

  netClient.onPlayerJoined((idx) => {
    playerCount = Math.max(playerCount, idx + 1);
    if (gameState === 'lobby') {
      showLobbyUI();
    }
  });

  netClient.onPlayerReady((idx) => {
    readyPlayers.add(idx);
    if (gameState === 'lobby') {
      showLobbyUI();
    }
  });

  netClient.onRaceStarted(() => {
    startMultiplayerRace();
  });

  netClient.onError((msg) => {
    alert('Error: ' + msg);
  });

  netClient.connect();

  // Wait for connection
  const checkConnected = setInterval(() => {
    if (netClient.isConnected()) {
      clearInterval(checkConnected);
      netClient.createRoom(playerName);
    }
  }, 100);
}

function onJoinRoom(roomCodeInput: string, playerName: string): void {
  netClient = new NetClient(SERVER_URL);
  
  netClient.onJoinedRoom((code, idx) => {
    roomCode = code;
    playerIndex = idx;
    playerCount = idx + 1;
    isHost = false;
    gameState = 'lobby';
    showLobbyUI();
  });

  netClient.onPlayerJoined((idx) => {
    playerCount = Math.max(playerCount, idx + 1);
    if (gameState === 'lobby') {
      showLobbyUI();
    }
  });

  netClient.onPlayerReady((idx) => {
    readyPlayers.add(idx);
    if (gameState === 'lobby') {
      showLobbyUI();
    }
  });

  netClient.onRaceStarted(() => {
    startMultiplayerRace();
  });

  netClient.onError((msg) => {
    alert('Error: ' + msg);
  });

  netClient.connect();

  const checkConnected = setInterval(() => {
    if (netClient.isConnected()) {
      clearInterval(checkConnected);
      netClient.joinRoom(roomCodeInput.toUpperCase(), playerName);
    }
  }, 100);
}

function showLobbyUI(): void {
  showLobby(
    roomCode || '',
    playerCount,
    readyPlayers,
    isHost,
    () => {
      netClient.ready();
      readyPlayers.add(playerIndex);
      showLobbyUI();
    },
    () => {
      netClient.start();
    }
  );
}

function startMultiplayerRace(): void {
  gameState = 'racing';
  
  // Clear any existing track/kart meshes
  const scene = getScene();
  const toRemove: THREE.Object3D[] = [];
  scene.traverse((obj) => {
    if (obj.name.startsWith('kart-') || obj.name === 'track-mesh') {
      toRemove.push(obj);
    }
  });
  toRemove.forEach((obj) => scene.remove(obj));
  
  // Create track meshes
  createTrackMeshes(track, scene);
  
  // Create kart meshes for all players
  for (let i = 0; i < playerCount; i++) {
    createKartMesh(i, scene);
  }
  
  // Start the game
  startRace({
    seed: raceSeed,
    playerCount,
    playerIndex,
    totalLaps,
    track,
    netClient,
    onTick: (tick, placements) => {
      showRaceHUD(tick, totalLaps, placements, playerIndex);
    },
    onRaceEnd: (placements) => {
      gameState = 'results';
      showResults(placements);
    }
  });
}

// Start the render loop
init();
requestAnimationFrame(gameLoop);
