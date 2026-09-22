console.clear();

import { useState, useEffect, useRef } from "react";

export default function App() {
  const colors = ["red", "yellow", "green", "blue"];

  const deckRef = useRef([]);

  function getDeck() {
    const numberCards1 = colors.flatMap((color) => {
      return Array.from({ length: 10 }, (_, idx) => {
        return {
          value: idx,
          color,
        };
      });
    });

    const numberCards2 = colors.flatMap((color) => {
      return Array.from({ length: 9 }, (_, idx) => {
        return {
          value: idx + 1,
          color,
        };
      });
    });

    const skipCards = colors.flatMap((color) => {
      return Array.from({ length: 2 }, () => {
        return {
          value: "skip",
          color,
        };
      });
    });

    const switchCards = colors.flatMap((color) => {
      return Array.from({ length: 2 }, () => {
        return {
          value: "switch",
          color,
        };
      });
    });

    const plus2Cards = colors.flatMap((color) => {
      return Array.from({ length: 2 }, () => {
        return {
          value: "+2",
          color,
        };
      });
    });

    const plus4Cards = colors.flatMap(() => {
      return Array.from({ length: 1 }, () => {
        return {
          value: "+4",
        };
      });
    });

    const wildCards = colors.flatMap(() => {
      return Array.from({ length: 1 }, () => {
        return {
          value: "wild",
        };
      });
    });

    const specialCards = [
      ...skipCards,
      ...switchCards,
      ...plus2Cards,
      ...plus4Cards,
      ...wildCards,
    ];

    // return numberCards1;
    return [...numberCards1, ...numberCards2, ...specialCards];
  }

  // function getRandomCard() {
  //   const randomIdx = Math.floor(Math.random() * colors.length);

  //   const randomValue = Math.floor(Math.random() * 15);
  //   const randomColor = colors[randomIdx];

  //   return {
  //     value:
  //       randomValue < 10
  //         ? randomValue
  //         : randomValue === 10
  //           ? "skip"
  //           : randomValue === 11
  //             ? "switch"
  //             : randomValue === 12
  //               ? "+2"
  //               : randomValue === 13
  //                 ? "+4"
  //                 : "wild",
  //     // only add color property if the card is not +4 or wild
  //     ...(randomValue < 13 && { color: randomColor }),
  //   };
  // }

  function getRandomCard(isCardToMatch) {
    // if (deckRef.current.length === 0) {
    //   const fullDeck = getDeck();
    //   deckRef.current = fullDeck;
    //   setDeck(fullDeck);
    // }

    let picked;
    do {
      const randomIdx = Math.floor(Math.random() * deckRef.current.length);
      picked = deckRef.current[randomIdx];
      // first cardToMatch should only be a number
      if (!isCardToMatch) break;
    } while (typeof picked.value === "string");

    // remove exactly one physical card instance from the deck
    const nextDeck = deckRef.current.filter((card) => card !== picked);
    deckRef.current = nextDeck;
    setDeck(nextDeck);

    return picked;
  }

  function getStartStack() {
    // return Array.from({ length: 2 }, () => getRandomCard());
    return Array.from({ length: 7 }, () => getRandomCard());
  }

  const [deck, setDeck] = useState(() => {
    const deck = getDeck();
    deckRef.current = deck;
    return deck;
  });
  const [pcCards, setPcCards] = useState(() => getStartStack());
  // const [pcCards, setPcCards] = useState([
  //   {
  //     value: 1,
  //     color: "red",
  //   },
  //   {
  //     value: 2,
  //     color: "green",
  //   },
  // ]);
  // const [myCards, setMyCards] = useState([
  //   {
  //     value: 3,
  //     color: "blue",
  //   },
  //   {
  //     value: "switch",
  //     color: "blue",
  //   },
  // {
  //   value: "+4",
  // },
  // {
  //   value: "wild",
  // },
  //   {
  //     value: "skip",
  //     color: "blue",
  //   },
  // ]);
  const [myCards, setMyCards] = useState(() => getStartStack());
  // const [myCards, setMyCards] = useState([
  //   {
  //     value: 1,
  //     color: "green",
  //   },
  //   {
  //     value: 1,
  //     color: "green",
  //   },
  // ]);
  const [cardToMatch, setCardToMatch] = useState(() =>
    getRandomCard("isCardToMatch"),
  );
  // const [cardToMatch, setCardToMatch] = useState({
  //   value: 3,
  //   color: "blue",
  // });
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [isBoardLocked, setIsBoardLocked] = useState(false);
  const [hasCalledUNO, setHasCalledUNO] = useState(false);
  const [alreadyDrewCard, setAlreadyDrewCard] = useState(false);
  const [isColorPickerActive, setIsColorPickerActive] = useState(false);

  function refillDeck() {
    const fullDeck = getDeck();
    const cardsInUse = [...myCards, ...pcCards, cardToMatch];

    const newDeck = fullDeck.filter(
      (card1) =>
        !cardsInUse.some(
          (card2) => card2.value === card1.value && card2.color === card1.color,
        ),
    );

    // console.log(newDeck);
    deckRef.current = newDeck;
    setDeck(newDeck);
  }

  function isPlayableCard(card, cardToMatchLocal) {
    return (
      card.value === cardToMatchLocal.value ||
      card.color === cardToMatchLocal.color ||
      card.value === "wild" ||
      card.value === "+4" ||
      // cardToMatchLocal.value === "wild" ||
      cardToMatchLocal.value === "+4"
    );
  }

  function applyPenaltyIfNeeded(card, playerWhoPlayed) {
    const penaltyReceiver = playerWhoPlayed === "me" ? "pc" : "me";
    if (card.value === "+4") {
      for (let idx = 0; idx < 4; idx++) {
        drawCard(penaltyReceiver, true);
      }
    } else if (card.value === "+2") {
      for (let idx = 0; idx < 2; idx++) {
        drawCard(penaltyReceiver, true);
      }
    }
  }

  function pickColor(color) {
    // console.log(color);
    setCardToMatch({ color });
    setIsColorPickerActive(false);
    endMyTurn();
  }

  function playCard(card, player, context = {}) {
    // console.log(card);

    // my turn
    if (player === "me") {
      if (isBoardLocked) return;

      if (card.value === "wild" && myCards.length > 1) {
        setIsColorPickerActive(true);
        setIsBoardLocked(true);
        setMyCards((prev) => prev.filter((prevCard) => prevCard !== card));
        return;
      }

      const isMatch = isPlayableCard(card, cardToMatch);

      if (!isMatch) {
        return;
      } else {
        setMyCards((prev) => prev.filter((prevCard) => prevCard !== card));

        // console.log(card);
        // console.log(myCards.filter((myCardsCard) => myCardsCard !== card));

        applyPenaltyIfNeeded(card, "me");

        if (
          card.value !== "skip" &&
          card.value !== "switch" &&
          card.value !== "+2" &&
          card.value !== "+4"
        ) {
          // console.log("not skip or switch");

          endMyTurn();
        }

        // length not 0 but 1 because myCards will be updated afterwards
        if (myCards.length === 1) {
          setWinner("me");
        }
      }
    } else {
      // pc turn
      const pcCardsLocal = context.pcCardsLocal ?? pcCards;
      const nextPcCards = pcCardsLocal.filter((prevCard) => prevCard !== card);

      setPcCards(nextPcCards);
      applyPenaltyIfNeeded(card, "pc");
      let nextCardToMatch = card;

      if (card.value === "wild") {
        nextCardToMatch = { color: getMostCommonPcCardColor() };
      }

      setCardToMatch(nextCardToMatch);

      return {
        nextPcCards,
        nextCardToMatch,
        extraTurn:
          card.value === "skip" ||
          card.value === "switch" ||
          card.value === "+2" ||
          card.value === "+4",
      };
    }

    setCardToMatch(card);
  }

  function getMostCommonPcCardColor() {
    let pcCardsColors = [];

    pcCards.forEach((pcCard) => {
      // skip if card is "+4" or "wild"
      if (!pcCard.color) return;

      const existingColor = pcCardsColors.find(
        (color) => color.color === pcCard.color,
      );

      if (existingColor) {
        existingColor.count++;
      } else {
        pcCardsColors.push({ color: pcCard.color, count: 1 });
      }
    });

    pcCardsColors.sort((a, b) => b.count - a.count);
    // console.log(pcCardsColors);

    if (pcCardsColors.length > 0) {
      return pcCardsColors[0].color;
    } else {
      const randomIdx = Math.floor(Math.random() * colors.length);
      return colors[randomIdx];
    }
  }

  function drawCard(player, isPenalty) {
    // my turn
    if (player === "me") {
      if (!isPenalty && (isBoardLocked || alreadyDrewCard)) return;
      // console.log("i take 4 or 2");

      setMyCards((prev) => [...prev, getRandomCard()]);
      !isPenalty && setAlreadyDrewCard(true);
      setHasCalledUNO(false);
    } else {
      // console.log("pc takes 4 or 2");

      // pc turn
      setPcCards((prev) => [...prev, getRandomCard()]);
    }
  }

  function endMyTurn() {
    setIsBoardLocked(true);
    setAlreadyDrewCard(false);
    setIsMyTurn(false);
  }

  function pcTurn() {
    function pcTurnWithState(pcCardsLocal, cardToMatchLocal) {
      setTimeout(() => {
        const matchingCard = pcCardsLocal.find((card) =>
          isPlayableCard(card, cardToMatchLocal),
        );

        if (matchingCard) {
          const result = playCard(matchingCard, "pc", {
            pcCardsLocal,
            cardToMatchLocal,
          });

          // no extraTurn on last card
          if (result?.extraTurn && result.nextPcCards.length > 0) {
            // console.log("skip or switch");
            // use returned "next" values to avoid stale state loops
            pcTurnWithState(result.nextPcCards, result.nextCardToMatch);
          } else {
            // console.log("not skip or switch");
            setIsBoardLocked(false);
            setIsMyTurn(true);
          }
        } else {
          // no matching card
          // draw exactly once, then (optionally) play the drawn card
          const drawnCard = getRandomCard();
          const nextPcCardsAfterDraw = [...pcCardsLocal, drawnCard];

          setPcCards(nextPcCardsAfterDraw);

          if (isPlayableCard(drawnCard, cardToMatchLocal)) {
            const result = playCard(drawnCard, "pc", {
              pcCardsLocal: nextPcCardsAfterDraw,
              cardToMatchLocal,
            });

            // prevent infinite loops: only recurse when we still have cards
            if (result?.extraTurn && result.nextPcCards.length > 0) {
              pcTurnWithState(result.nextPcCards, result.nextCardToMatch);
            } else {
              setIsBoardLocked(false);
              setIsMyTurn(true);
            }
          } else {
            setIsBoardLocked(false);
            setIsMyTurn(true);
          }
        }
        // }, 500);
      }, 1000);
    }

    pcTurnWithState(pcCards, cardToMatch);
  }

  function newGame() {
    const newDeck = getDeck();
    deckRef.current = newDeck;
    setDeck(newDeck);
    setPcCards(getStartStack());
    setMyCards(getStartStack());
    setCardToMatch(getRandomCard("isCardToMatch"));
    setIsMyTurn(true);
    setWinner(null);
    setIsBoardLocked(false);
    setHasCalledUNO(false);
  }

  // check for win/loss / initiate pc Turn
  useEffect(() => {
    if (!isMyTurn && !winner) {
      pcTurn();
    }

    if (myCards.length > 1) {
      setHasCalledUNO(false);
    }

    if (myCards.length === 1 && !hasCalledUNO) {
      for (let idx = 0; idx < 2; idx++) {
        drawCard("me", true);
      }
    }

    // if (myCards.length === 0) {
    //   setWinner("me");
    // }

    if (pcCards.length === 0) {
      setWinner("pc");
    }

    if (deck.length === 0) {
      refillDeck();
    }
    // myCards in deps so if hasnt called uno before playing a "skipping" card, penalty is applied
  }, [isMyTurn, myCards]);

  // lock board at end of game
  useEffect(() => {
    if (winner) {
      setIsBoardLocked(true);
    }
  }, [winner]);

  // JSX

  const valueEl = (card) => {
    const wildCardDivs = (
      <>
        <div className="wild-red"></div>
        <div className="wild-blue"></div>
        <div className="wild-yellow"></div>
        <div className="wild-green"></div>
      </>
    );
    return (
      <div className="value">
        {card.value === "skip" ? (
          <span className="material-symbols-outlined">block</span>
        ) : card.value === "switch" ? (
          <span className="material-symbols-outlined switch">swap_vert</span>
        ) : card.value === "+2" ? (
          "+2"
        ) : card.value === "+4" ? (
          <div className="wild four">{wildCardDivs}</div>
        ) : card.value === "wild" ? (
          <div className="wild">{wildCardDivs}</div>
        ) : (
          card.value
        )}
      </div>
    );
  };

  // temp
  // const deckEls = deck.map((card, idx) => (
  //   <div className={`card ${card.color || ""}`} key={card.color + card.value + idx}>
  //     {valueEl(card)}
  //   </div>
  // ));

  // temp
  // const pcCardEls = pcCards.map((card, idx) => (
  //   <div className={`card ${card.color || ""}`} key={card.color + card.value + idx}>
  //     {valueEl(card)}
  //   </div>
  // ));

  const pcCardEls = Array.from(
    { length: pcCards.length <= 7 ? pcCards.length : 7 },
    (_, idx) => (
      <div className="card backface" key={idx}>
        {pcCards.length > 7 && idx === 6 && `+${pcCards.length - 7}`}
      </div>
    ),
  );

  const myCardEls = myCards.map((card, idx) => (
    <div
      // only add color class if card has color (not +4 or wild)
      className={`card selectable ${card.color || ""}`}
      onClick={() => playCard(card, "me")}
      key={card.color + card.value + idx}
    >
      {valueEl(card)}
    </div>
  ));

  const cardToMatchEl = (
    <div className={`card ${cardToMatch.color || ""}`}>
      {/* only show value if theres one (not card after colorPicker) */}
      {"value" in cardToMatch && valueEl(cardToMatch)}
    </div>
  );

  const colorpickerCardEls = colors.map((color) => (
    <div
      className={`card selectable ${color}`}
      onClick={() => pickColor(color)}
      key={color}
    ></div>
  ));

  return (
    <>
      {/* temp */}
      {/* <div className="cards">{deckEls}</div> */}

      {/* pc cards */}
      <div
        className={isBoardLocked ? "cards pc-cards" : "cards pc-cards locked"}
      >
        {pcCardEls}
      </div>

      {/* middle row */}
      {isColorPickerActive ? (
        <div className="cards">{colorpickerCardEls}</div>
      ) : (
        <div className="cards">
          {/* UNO button */}
          {!winner && (
            <button
              className={hasCalledUNO ? "calledUNO" : ""}
              onClick={() => setHasCalledUNO(true)}
            >
              UNO!
            </button>
          )}

          {/* discard pile */}
          {cardToMatchEl}

          {winner ? (
            <>
              {/* message */}
              <div className="message">
                {winner === "me" ? "You win!" : "You lose!"}
              </div>

              {/* new game button */}
              <button onClick={newGame}>New Game</button>
            </>
          ) : alreadyDrewCard ? (
            // end turn button
            <button onClick={endMyTurn}>End Turn</button>
          ) : (
            // deck
            <div
              className="card backface selectable"
              onClick={() => drawCard("me")}
            ></div>
          )}
        </div>
      )}
      {/* my cards */}
      <div className={isBoardLocked ? "cards locked" : "cards"}>
        {myCardEls}
      </div>
    </>
  );
}
