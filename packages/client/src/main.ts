import { initRenderer } from './renderer';
import { initInput } from './input';
import { initGame, gameLoop } from './game';

initRenderer();
initInput();
initGame();

requestAnimationFrame(gameLoop);
