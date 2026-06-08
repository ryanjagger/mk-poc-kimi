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
    pointer-events: none;
    font-family: sans-serif;
    color: white;
    text-shadow: 1px 1px 2px black;
  `;
  document.body.appendChild(overlay);
}

export function showLobby(roomCode: string, playerCount: number): void {
  const overlay = document.getElementById('ui-overlay');
  if (!overlay) return;
  overlay.innerHTML = `
    <div style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 20px; border-radius: 8px;">
      <h2>Lobby</h2>
      <p>Room: ${roomCode}</p>
      <p>Players: ${playerCount}/4</p>
      <p>Press SPACE when ready</p>
    </div>
  `;
}

export function showRaceHUD(lap: number, totalLaps: number, placement: number): void {
  const overlay = document.getElementById('ui-overlay');
  if (!overlay) return;
  overlay.innerHTML = `
    <div style="position: absolute; top: 20px; left: 20px; font-size: 24px; font-weight: bold;">
      Lap ${lap}/${totalLaps}
    </div>
    <div style="position: absolute; top: 20px; right: 20px; font-size: 24px; font-weight: bold;">
      ${placement ? `#${placement}` : ''}
    </div>
  `;
}

export function showResults(placements: { playerIndex: number; placement: number }[]): void {
  const overlay = document.getElementById('ui-overlay');
  if (!overlay) return;
  const rows = placements
    .sort((a, b) => a.placement - b.placement)
    .map((p) => `<tr><td>${p.placement}</td><td>Player ${p.playerIndex + 1}</td></tr>`)
    .join('');
  overlay.innerHTML = `
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); padding: 40px; border-radius: 12px; text-align: center;">
      <h1>Race Results</h1>
      <table style="margin: 0 auto; font-size: 20px;">
        <thead><tr><th>Place</th><th>Player</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
