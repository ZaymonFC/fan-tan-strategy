import {
  type Hand,
  type GameState,
  type GameEvent,
  validPlays,
  type Card,
  ranks,
  type Rank,
  type Suit,
} from "./pec-wa";

export type PlayHand = (player: number, hand: Hand, runs: GameState["runs"]) => GameEvent;

export const randomStrategy: PlayHand = (player, hand, runs) => {
  const availablePlays = validPlays(hand, runs);

  if (availablePlays.length === 0) {
    return { type: "passTurn", player };
  }

  return {
    type: "playCard",
    player,
    card: availablePlays[Math.floor(Math.random() * availablePlays.length)],
  };
};

/**
    This is my current strategy as I see it.
    We want to play the card that blocks the most possible cards from being played later,
    without blocking ourselves from playing cards later.
*/
export const zaymon1: PlayHand = (player, hand, runs) => {
  const availablePlays = validPlays(hand, runs);

  if (availablePlays.length === 0) {
    return { type: "passTurn", player };
  }

  if (availablePlays.length === 1) {
    return {
      type: "playCard",
      player,
      card: availablePlays[0],
    };
  }

  // The fun begins. I'm going to use a heuristic to determine which card to play.

  // Cards we want to play the most:
  // 1. Cards, where we have the next one in the sequence, meaning progression is still blocked.
  // 2. Cards, where we have a card far away from it, further down in the sequence, we need to unblock the sequence to save it later on.

  // Cards we want to play the least:
  // 1. Cards, where the card is our personal highest card for that suit. This blocks progression.
  // 2. Cards, where the card is our personal lowest card for that suit. This blocks progression.

  const handBySuit = hand.reduce(
    (acc, card) => {
      if (!acc[card.suit]) {
        acc[card.suit] = [];
      }
      acc[card.suit].push(card);
      return acc;
    },
    {} as Record<Suit, Card[]>,
  );

  const getRankIndex = (rank: Rank) => ranks.indexOf(rank);

  const heuristics = [
    {
      name: "highest in hand",
      value: -1,
      predicate: (card: Card) => {
        // check if card is last in handBySuit
        const suit = handBySuit[card.suit];
        return suit[suit.length - 1].rank === card.rank;
      },
    },
    {
      name: "lowest in hand",
      value: -1,
      predicate: (card: Card) => {
        // check if card is first in handBySuit
        const suit = handBySuit[card.suit];
        return suit[0].rank === card.rank;
      },
    },
    {
      // If we have the very next card, we want to play this, because it still blocks progression.
      name: "next in sequence",
      predicate: (card: Card) => {
        const rankIndex = getRankIndex(card.rank);
        if (card.rank === "A" || card.rank === "K") {
          return 0;
        }

        // do we have the next card in the sequence in our hand?
        // if above 7, rank + 1, if below 7, rank - 1
        const nextRank = rankIndex > 6 ? ranks[rankIndex + 1] : ranks[rankIndex - 1];
        return handBySuit[card.suit].some((c) => c.rank === nextRank) ? 1 : 0;
      },
    },
    {
      name: "distance from end card in hand",
      predicate: (card: Card) => {
        const suit = handBySuit[card.suit];
        const cardIndex = getRankIndex(card.rank);
        const sevenIndex = getRankIndex("7");

        let endCardIndex;
        if (cardIndex < sevenIndex) {
          // For cards below 7, compare with our lowest card
          endCardIndex = getRankIndex(suit[0].rank);
        } else {
          // For cards above 7, compare with our highest card
          endCardIndex = getRankIndex(suit[suit.length - 1].rank);
        }

        return Math.abs(endCardIndex - cardIndex);
      },
    },
  ];

  // Calculate score for each available play
  const scoredPlays = availablePlays.map((card) => {
    let score = 0;
    for (const heuristic of heuristics) {
      if (typeof heuristic.value === "number") {
        score += heuristic.predicate(card) ? heuristic.value : 0;
      } else {
        score += heuristic.predicate(card);
      }
    }
    return { card, score };
  });

  // Choose the play with the highest score
  const bestPlay = scoredPlays.reduce((best, current) =>
    current.score > best.score ? current : best,
  );

  return {
    type: "playCard",
    player,
    card: bestPlay.card,
  };
};
