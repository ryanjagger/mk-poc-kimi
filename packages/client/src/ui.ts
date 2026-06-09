/**
 * Simple UI overlay for lobby, race, and results.
 */

export function createUIOverlay(): void {
  const overlay = document.createElement('div');
  overlay.id = 'ui-overlay';
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: auto;
    font-family: sans-serif;
    color: white;
    text-shadow: 1px 1px 2px black;
  `;
  document.body.appendChild(overlay);
}

export function showMenu(
  onCreate: (name: string) => void,
  onJoin: (code: string, name: string) => void
): void {
  const overlay = document.getElementById('ui-overlay');
  if (!overlay) return;
  overlay.innerHTML = `
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.85); padding: 40px; border-radius: 12px; text-align: center; min-width: 300px;">
      <h1 style="margin-top: 0; font-size: 32px;">Kart Racer</h1>
      <div style="margin-bottom: 20px;">
        <input type="text" id="player-name" placeholder="Your Name" value="Player" style="padding: 10px; font-size: 16px; width: 200px; border-radius: 4px; border: none;" />
      </div>
      <div style="margin-bottom: 20px;">
        <button id="btn-create" style="padding: 12px 24px; font-size: 16px; cursor: pointer; border-radius: 4px; border: none; background: #4CAF50; color: white; margin-right: 10px;">Create Room</button>
      </div>
      <div style="margin-bottom: 10px;">
        <input type="text" id="room-code" placeholder="Room Code" style="padding: 10px; font-size: 16px; width: 120px; border-radius: 4px; border: none; text-transform: uppercase;" />
        <button id="btn-join" style="padding: 12px 24px; font-size: 16px; cursor: pointer; border-radius: 4px; border: none; background: #2196F3; color: white;">Join</button>
      </div>
    </div>
  `;

  document.getElementById('btn-create')?.addEventListener('click', () => {
    const name = (document.getElementById('player-name') as HTMLInputElement)?.value || 'Player';
    onCreate(name);
  });

  document.getElementById('btn-join')?.addEventListener('click', () => {
    const name = (document.getElementById('player-name') as HTMLInputElement)?.value || 'Player';
    const code = (document.getElementById('room-code') as HTMLInputElement)?.value || '';
    onJoin(code, name);
  });
}

export function showLobby(
  roomCode: string,
  playerCount: number,
  readyPlayers: Set<number>,
  isHost: boolean,
  onReady: () => void,
  onStart: () => void
): void {
  const overlay = document.getElementById('ui-overlay');
  if (!overlay) return;

  const readyList = Array.from({ length: 4 }, (_, i) => {
    const isReady = readyPlayers.has(i);
    const isHere = i < playerCount;
    return `<div style="padding: 8px; margin: 4px 0; background: ${isHere ? (isReady ? '#4CAF50' : '#555') : '#333'}; border-radius: 4px;">
      Player ${i + 1} ${isHere ? (isReady ? '✓ Ready' : '...') : '(empty)'}
    </div>`;
  }).join('');

  overlay.innerHTML = `
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.85); padding: 40px; border-radius: 12px; text-align: center; min-width: 300px;">
      <h2 style="margin-top: 0;">Lobby</h2>
      <p style="font-size: 24px; font-weight: bold; color: #FFD700;">Room: ${roomCode}</p>
      <div style="text-align: left; margin: 20px 0;">
        ${readyList}
      </div>
      <div style="margin-top: 20px;">
        <button id="btn-ready" style="padding: 12px 24px; font-size: 16px; cursor: pointer; border-radius: 4px; border: none; background: #4CAF50; color: white; margin-right: 10px;">Ready</button>
        ${isHost ? `<button id="btn-start" style="padding: 12px 24px; font-size: 16px; cursor: pointer; border-radius: 4px; border: none; background: #FF9800; color: white;">Start Race</button>` : ''}
      </div>
    </div>
  `;

  document.getElementById('btn-ready')?.addEventListener('click', () => {
    onReady();
    const btn = document.getElementById('btn-ready');
    if (btn) btn.style.background = '#888';
  });

  if (isHost) {
    document.getElementById('btn-start')?.addEventListener('click', () => {
      onStart();
    });
  }
}

export function showRaceHUD(
  tick: number,
  totalLaps: number,
  placements: number[],
  playerIndex: number
): void {
  const overlay = document.getElementById('ui-overlay');
  if (!overlay) return;

  const kart = placements[playerIndex];
  const lap = Math.min(Math.floor(tick / 60) + 1, totalLaps); // Rough estimate, actual lap is in simState
  const placement = kart ? kart + 1 : '-';

  overlay.innerHTML = `
    <div style="position: absolute; top: 20px; left: 20px; font-size: 24px; font-weight: bold; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 4px;">
      Lap ${lap}/${totalLaps}
    </div>
    <div style="position: absolute; top: 20px; right: 20px; font-size: 24px; font-weight: bold; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 4px;">
      #${placement}
    </div>
  `;
}

export function showResults(placements: { playerIndex: number; placement: number }[]): void {
  const overlay = document.getElementById('ui-overlay');
  if (!overlay) return;
  const rows = placements
    .sort((a, b) => a.placement - b.placement)
    .map((p) => `<tr><td style="padding: 10px; font-size: 24px; font-weight: bold;">${p.placement}</td><td style="padding: 10px; font-size: 20px;">Player ${p.playerIndex + 1}</td></tr>`)
    .join('');
  overlay.innerHTML = `
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.85); padding: 40px; border-radius: 12px; text-align: center;">
      <h1 style="margin-top: 0; font-size: 36px;">Race Results</h1>
      <table style="margin: 20px auto; font-size: 20px;">
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top: 20px; color: #aaa;">Refresh to play again</p>
    </div>
  `;
}
