import { react } from "signia";
import { createGame, pretty, type GameState } from "./pec-wa";
import { type PlayHand, randomStrategy } from "./strategies";

type PecWaPlayer = { player: number; play: PlayHand };

const gameRunner = (players: PecWaPlayer[], quiet = false): Promise<GameState> => {
  return new Promise((resolve) => {
    let { state$, dispatch } = createGame();

    const stop = react("game-react", () => {
      const state = state$.value;

      if (state.winner !== null) {
        if (!quiet) {
          console.log("Game Over!");
          console.log(pretty.gameState(state));
        }
        stop();
        resolve(state);
        return;
      }

      const player = players[state.currentPlayer];
      const playerHand = state.players[state.currentPlayer];
      const event = player.play(state.currentPlayer, playerHand, state.runs);

      if (!quiet) {
        console.log(pretty.gameEvent(event));
      }

      queueMicrotask(() => dispatch({ ...event, player: state.currentPlayer }));
    });
  });
};

// Usage:
const players: PecWaPlayer[] = [
  { player: 0, play: randomStrategy },
  { player: 1, play: randomStrategy },
  { player: 2, play: randomStrategy },
  { player: 3, play: randomStrategy },
];

await gameRunner(players);
