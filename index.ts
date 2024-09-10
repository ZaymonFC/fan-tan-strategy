import { react } from "signia";
import { createGame, pretty, type GameState } from "./pec-wa";
import { type PlayHand, randomStrategy, zaymon1 } from "./strategies";

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

async function testRandomStrategies(numGames: number = 5000) {
  const players: PecWaPlayer[] = [
    { player: 0, play: randomStrategy },
    { player: 1, play: randomStrategy },
    { player: 2, play: randomStrategy },
    { player: 3, play: zaymon1 },
  ];

  const winCounts: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0 };

  console.log(`Running ${numGames} games...`);

  for (let i = 0; i < numGames; i++) {
    const finalState = await gameRunner(players, true);
    if (finalState.winner !== null) {
      winCounts[finalState.winner]++;
    }

    if ((i + 1) % 100 === 0) {
      console.log(`Completed ${i + 1} games`);
    }
  }

  console.log("\nResults:");
  for (let player = 0; player < 4; player++) {
    const winPercentage = ((winCounts[player] / numGames) * 100).toFixed(2);
    console.log(`Player ${player}: ${winCounts[player]} wins (${winPercentage}%)`);
  }

  // Chi-square test for balance
  const expectedWins = numGames / 4;
  const chiSquare = Object.values(winCounts).reduce((sum, wins) => {
    return sum + Math.pow(wins - expectedWins, 2) / expectedWins;
  }, 0);

  console.log(`\nChi-square statistic: ${chiSquare.toFixed(4)}`);
  console.log("For 3 degrees of freedom:");
  console.log("  p < 0.05 critical value: 7.8147");
  console.log("  p < 0.01 critical value: 11.3449");
  console.log(`The strategies are ${chiSquare < 7.8147 ? "likely" : "unlikely"} to be balanced.`);
}

// Run the test
testRandomStrategies();
