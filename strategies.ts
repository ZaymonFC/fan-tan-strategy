import { type Hand, type GameState, type GameEvent, validPlays } from "./pec-wa";

export type PlayHand = (player: number, hand: Hand, runs: GameState["runs"]) => GameEvent;

export const randomStrategy: PlayHand = (player, hand, runs) => {
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
