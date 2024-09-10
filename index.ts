import { react } from "signia";
import {
  createGame,
  pretty,
  validPlays,
  type GameEvent,
  type GameState,
  type Hand,
} from "./pec-wa";

type PlayHand = (player: number, hand: Hand, runs: GameState["runs"]) => GameEvent;
type PecWaPlayer = { player: number; play: PlayHand };

const randomStrategy: PlayHand = (player, hand, runs) => {
  const availablePlays = validPlays(hand, runs);

  if (availablePlays.length === 0) {
    return { type: "passTurn", player };
  } else {
    return {
      type: "playCard",
      player,
      card: availablePlays[Math.floor(Math.random() * availablePlays.length)],
    };
  }
};

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
