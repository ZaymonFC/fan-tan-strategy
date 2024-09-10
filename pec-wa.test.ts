import { expect, test, describe } from "bun:test";
import {
  createGame,
  type GameState,
  isValidPlay,
  type Player,
  type GameEvent,
  type Card,
} from "./pec-wa";

describe("Chinese Sevens Variant Game", () => {
  test("initializeGameState creates a valid initial state", () => {
    const { state$ } = createGame();
    const state = state$.value;
    expect(state.players).toHaveLength(4);
    expect(state.players.every((hand: Card[]) => hand.length === 13)).toBe(true);
    expect(state.runs).toEqual({});
    expect(state.winner).toBeNull();
    expect([0, 1, 2, 3]).toContain(state.currentPlayer);
  });

  test("isValidPlay correctly validates plays", () => {
    const runs: GameState["runs"] = {
      hearts: [
        { suit: "hearts", rank: "6" },
        { suit: "hearts", rank: "7" },
        { suit: "hearts", rank: "8" },
      ],
      spades: [
        { suit: "spades", rank: "7" },
        { suit: "spades", rank: "8" },
        { suit: "spades", rank: "9" },
      ],
      diamonds: [{ suit: "diamonds", rank: "7" }],
    };
    expect(isValidPlay({ suit: "hearts", rank: "5" }, runs)).toBe(true);
    expect(isValidPlay({ suit: "hearts", rank: "9" }, runs)).toBe(true);
    expect(isValidPlay({ suit: "hearts", rank: "4" }, runs)).toBe(false);
    expect(isValidPlay({ suit: "hearts", rank: "10" }, runs)).toBe(false);
    expect(isValidPlay({ suit: "spades", rank: "6" }, runs)).toBe(true);
    expect(isValidPlay({ suit: "spades", rank: "10" }, runs)).toBe(true);
    expect(isValidPlay({ suit: "diamonds", rank: "6" }, runs)).toBe(true);
    expect(isValidPlay({ suit: "diamonds", rank: "8" }, runs)).toBe(true);
    expect(isValidPlay({ suit: "clubs", rank: "7" }, runs)).toBe(true);
    expect(isValidPlay({ suit: "clubs", rank: "8" }, runs)).toBe(false);
  });

  test("playCard updates game state correctly", () => {
    const { state$, dispatch } = createGame();
    let state = state$.value;

    // Ensure the first player has the 7 of hearts
    state.players[state.currentPlayer] = [
      { suit: "hearts", rank: "7" },
      { suit: "spades", rank: "8" },
    ];

    dispatch({
      type: "playCard",
      player: state.currentPlayer,
      card: { suit: "hearts", rank: "7" },
    });

    const newState = state$.value;

    expect(newState.players[state.currentPlayer]).toEqual([{ suit: "spades", rank: "8" }]);
    expect(newState.runs.hearts).toEqual([{ suit: "hearts", rank: "7" }]);
    expect(newState.currentPlayer).toBe(((state.currentPlayer + 1) % 4) as Player);
    expect(newState.winner).toBeNull();
  });

  test("sequence of plays results in correct game state", () => {
    const { state$, dispatch } = createGame();
    let state = state$.value;

    // Set up a controlled game state
    state.currentPlayer = 0;
    state.players = [
      [
        { suit: "hearts", rank: "7" },
        { suit: "hearts", rank: "8" },
        { suit: "spades", rank: "6" },
      ],
      [
        { suit: "hearts", rank: "9" },
        { suit: "spades", rank: "7" },
      ],
      [
        { suit: "hearts", rank: "10" },
        { suit: "spades", rank: "8" },
      ],
      [
        { suit: "hearts", rank: "6" },
        { suit: "spades", rank: "9" },
      ],
    ];
    state.runs = {};

    // Sequence of plays
    const events: GameEvent[] = [
      { type: "playCard", player: 0, card: { suit: "hearts", rank: "7" } },
      { type: "playCard", player: 1, card: { suit: "hearts", rank: "9" } },
      { type: "playCard", player: 2, card: { suit: "hearts", rank: "10" } },
      { type: "playCard", player: 3, card: { suit: "hearts", rank: "6" } },
      { type: "playCard", player: 0, card: { suit: "hearts", rank: "8" } },
      { type: "playCard", player: 1, card: { suit: "spades", rank: "7" } },
    ];

    events.forEach((event) => {
      dispatch(event);
    });

    const finalState = state$.value;

    // Assert final game state
    expect(finalState.runs.hearts).toEqual([
      { suit: "hearts", rank: "6" },
      { suit: "hearts", rank: "7" },
      { suit: "hearts", rank: "8" },
      { suit: "hearts", rank: "9" },
      { suit: "hearts", rank: "10" },
    ]);
    expect(finalState.runs.spades).toEqual([{ suit: "spades", rank: "7" }]);
    expect(finalState.players[0]).toEqual([{ suit: "spades", rank: "6" }]);
    expect(finalState.players[1]).toEqual([]);
    expect(finalState.players[2]).toEqual([{ suit: "spades", rank: "8" }]);
    expect(finalState.players[3]).toEqual([{ suit: "spades", rank: "9" }]);
    expect(finalState.currentPlayer).toBe(2);
    expect(finalState.winner).toBe(1);
  });
});
