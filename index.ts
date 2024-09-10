import { type GameEvent, type GameState, type Hand } from "./pec-wa";

type PlayHand = (hand: Hand, runs: GameState["runs"]) => GameEvent;

type PecWaPlayer = {
  player: number;
  exec: (hand: Hand, runs: GameState["runs"]) => GameEvent;
};

const randomStrategy: PlayHand = (hand, runs) => {
  // Implement me
};
