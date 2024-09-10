import { produce } from "immer";
import { atom } from "signia";

/**
 * Chinese Sevens Variant (We call it 'pec-wa')
 *
 * Introduction:
 * This game is a Chinese variant of the classic card game known as "Sevens" or "Fan Tan"
 * in other parts of the world. It's a trick-shedding card game that combines strategy,
 * luck, and careful planning. The objective is simple: be the first player to get rid
 * of all your cards. However, the restrictive playing rules and the inability to pass
 * make this game a challenging and engaging experience.
 *
 * Game Setup:
 * - Number of players: 4
 * - Cards: Standard 52-card deck
 * - Deal: All cards are dealt out evenly to all players at the beginning of the game
 *
 * Basic Rules:
 * 1. The game starts with the player who has the 7 of hearts playing that card.
 *    (Note: While hearts is the traditional starting suit, this choice is arbitrary
 *    and could be changed if desired.)
 * 2. Play proceeds clockwise around the table.
 * 3. On each turn, a player must play a card if they have a legal move available.
 *    There is no passing allowed if a legal play can be made.
 * 4. Legal plays involve adding to the existing layouts on the table:
 *    - Each suit forms its own layout, starting with the 7 of that suit.
 *    - Cards can be played immediately above or below the 7 in sequence.
 *    - For example, after the 7 of hearts is played, only the 6 or 8 of hearts
 *      can be played in that suit.
 * 5. As the game progresses, the sequences for each suit will expand, allowing
 *    more cards to be played.
 * 6. If a player cannot make a legal play, they must pass their turn.
 * 7. The game continues until one player has played all their cards, becoming the winner.
 *
 * Winning:
 * The first player to play all their cards wins the game. In some variations,
 * points might be awarded based on the number of cards remaining in other players' hands,
 * but this can vary by local rules.
 */

// Types
type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type Player = number;
export type Hand = Card[];

export interface GameState {
  currentPlayer: Player;
  players: Hand[];
  runs: Partial<Record<Suit, Card[]>>;
  winner: Player | null;
}

type PlayCardEvent = { type: "playCard"; player: Player; card: Card };
type PassTurnEvent = { type: "passTurn"; player: Player };
export type GameEvent = PlayCardEvent | PassTurnEvent;

// Helper functions
const createDeck = (): Card[] => {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  return suits.flatMap((suit) => ranks.map((rank) => ({ suit, rank })));
};

const shuffleDeck = (deck: Card[]): Card[] => {
  return [...deck].sort(() => Math.random() - 0.5);
};

const dealCards = (deck: Card[]): Card[][] => {
  const players: Card[][] = [[], [], [], []];
  deck.forEach((card, index) => {
    players[index % 4].push(card);
  });
  return players;
};

const initializeGameState = (): GameState => {
  const deck = shuffleDeck(createDeck());
  const players = dealCards(deck);
  return {
    currentPlayer: players.findIndex((hand) =>
      hand.some((card) => card.suit === "hearts" && card.rank === "7"),
    ) as Player,
    players,
    runs: {},
    winner: null,
  };
};

export const isValidPlay = (card: Card, runs: GameState["runs"]): boolean => {
  const run = runs[card.suit] || [];

  if (card.rank === "7") return true;
  if (run.length === 0) return false;

  const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const lowestRank = run[0].rank;
  const highestRank = run[run.length - 1].rank;
  const cardIndex = ranks.indexOf(card.rank);
  const lowestIndex = ranks.indexOf(lowestRank);
  const highestIndex = ranks.indexOf(highestRank);

  return cardIndex === lowestIndex - 1 || cardIndex === highestIndex + 1;
};

// Updated playCard function
const playCard = (state: GameState, event: PlayCardEvent): GameState => {
  return produce(state, (draft) => {
    const { player, card } = event;

    // Remove the card from the player's hand
    const index = draft.players[player].findIndex(
      (c) => c.suit === card.suit && c.rank === card.rank,
    );
    if (index > -1) {
      draft.players[player].splice(index, 1);
    }

    // Add the card to the run
    if (!draft.runs[card.suit]) {
      draft.runs[card.suit] = [];
    }
    const run = draft.runs[card.suit]!;
    const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

    if (run.length === 0 || card.rank === "7") {
      run.push(card);
    } else if (ranks.indexOf(card.rank) < ranks.indexOf(run[0].rank)) {
      run.unshift(card);
    } else {
      run.push(card);
    }

    // Sort the run to ensure correct order
    run.sort((a, b) => ranks.indexOf(a.rank) - ranks.indexOf(b.rank));

    // Check for winner
    if (draft.players[player].length === 0) {
      draft.winner = player;
    }

    // Move to the next player
    draft.currentPlayer = ((draft.currentPlayer + 1) % 4) as Player;
  });
};

const passTurn = (state: GameState, event: PassTurnEvent): GameState => {
  return produce(state, (draft) => {
    draft.currentPlayer = ((draft.currentPlayer + 1) % 4) as Player;
  });
};

export const createGame = () => {
  const initialState = initializeGameState();
  const state$ = atom("gameState", initialState);

  const dispatch = (event: GameEvent): void => {
    state$.update((state) => {
      switch (event.type) {
        case "playCard":
          return playCard(state, event);
        case "passTurn":
          return passTurn(state, event);
        default:
          return state;
      }
    });
  };

  return {
    state$,
    dispatch,
  };
};
