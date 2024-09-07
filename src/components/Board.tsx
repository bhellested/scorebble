import React, { useState, useCallback, useEffect } from "react";
import { IoPersonSharp } from "react-icons/io5";
import { CiCircleRemove } from "react-icons/ci";
import specialTiles from "../extras/SpecialTiles";
import Tile from "./Tile";
import Camera from "./Camera";
import dictionary from "../extras/dictionary";
import tileValues from "../extras/TileValues";
import PossibleWordsModal from "./PossibleWordsModal";
interface Player {
  name: string;
  score: number;
}
//same as above but we want a default constructor
class PlayedWord {
  word: string;
  value: number;
  blankIndex: number;
  multiplier: number;
  constructor(
    word: string,
    value: number,
    blankIndex: number,
    multiplier: number
  ) {
    this.word = word;
    this.value = value;
    this.multiplier = multiplier;
    this.blankIndex = blankIndex;
  }
}

const Board: React.FC = () => {
  const [letters, setLetters] = useState<string[][]>(
    Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => ""))
  );
  const [confirmedLetters, setConfirmedLetters] = useState<string[][]>(
    Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => ""))
  );
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTile, setSelectedTile] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [typingDirection, setTypingDirection] = useState<
    "horizontal" | "vertical"
  >("horizontal");
  const [takingPicture, setTakingPicture] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [badPhoto, setBadPhoto] = useState<boolean>(false);
  const [lettersNeedConfirmation, setLettersNeedConfirmation] =
    useState<boolean>(false);
  const [player, setPlayer] = useState<number>(0);
  const [possibleWords, setPossibleWords] = useState<string[]>([]);
  const [showPossibleWords, setShowPossibleWords] = useState<boolean>(false);
  const [onSelectWord, setOnSelectWord] = useState<() => void>(() => {});
  //map of the blank index to the letter that was chosen
  const [blankMap, setBlankMap] = useState<Map<number, string>>(new Map());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  //when letters differs from confirmedLetters, we need to enable the confirm board button
  useEffect(() => {
    const areEqual = letters.every((row, i) =>
      row.every((letter, j) => letter === confirmedLetters[i][j])
    );
    if (!areEqual) {
      setLettersNeedConfirmation(true);
    }
  }, [letters, confirmedLetters]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!selectedTile) return;

      const { key } = event;
      const { row, col } = selectedTile;

      if (
        key === "ArrowRight" ||
        key === "ArrowLeft" ||
        key === "ArrowUp" ||
        key === "ArrowDown"
      ) {
        event.preventDefault();
        let newRow = row;
        let newCol = col;

        switch (key) {
          case "ArrowRight":
            newCol = Math.min(col + 1, 14);
            break;
          case "ArrowLeft":
            newCol = Math.max(col - 1, 0);
            break;
          case "ArrowDown":
            newRow = Math.min(row + 1, 14);
            break;
          case "ArrowUp":
            newRow = Math.max(row - 1, 0);
            break;
        }

        setSelectedTile({ row: newRow, col: newCol });
      } else if (/^[a-zA-Z]$/.test(key) || key === " ") {
        //update the letter iff the letter is not already in the confirmedLetters
        if (confirmedLetters[row][col] === "") {
          event.preventDefault();
          const newLetters = [...letters];
          newLetters[row][col] = key.toUpperCase();
          setLetters(newLetters);
        }

        // Move to next tile based on typing direction
        if (typingDirection === "horizontal" && col < 14) {
          setSelectedTile({ row, col: col + 1 });
        } else if (typingDirection === "vertical" && row < 14) {
          setSelectedTile({ row: row + 1, col });
        }
      } else if (key === "Alt") {
        //switch between horizontal and vertical typing
        setTypingDirection(
          typingDirection === "horizontal" ? "vertical" : "horizontal"
        );
      } else if (key === "Delete" || key === "Backspace") {
        //delete the letter in the selected tile
        const newLetters = [...letters];
        newLetters[row][col] = "";
        setLetters(newLetters);
        //move back to the previous tile
        if (typingDirection === "horizontal" && col > 0) {
          setSelectedTile({ row, col: col - 1 });
        } else if (typingDirection === "vertical" && row > 0) {
          setSelectedTile({ row: row - 1, col });
        }
      }
    },
    [selectedTile, letters, typingDirection]
  );

  const ModifyWordSpecialTile = (
    word: PlayedWord,
    rowIndex: number,
    colIndex: number
  ) => {
    const tile = specialTiles.get(`${rowIndex},${colIndex}`);
    switch (tile ?? "") {
      case "TW":
        word.multiplier *= 3;
        word.value += tileValues.get(letters[rowIndex][colIndex]) ?? 0;
        break;
      case "DW":
        word.multiplier *= 2;
        word.value += tileValues.get(letters[rowIndex][colIndex]) ?? 0;
        break;
      case "TL":
        word.value += (tileValues.get(letters[rowIndex][colIndex]) ?? 0) * 3;
        break;
      case "DL":
        word.value += (tileValues.get(letters[rowIndex][colIndex]) ?? 0) * 2;
        break;
      default:
        word.value += tileValues.get(letters[rowIndex][colIndex]) ?? 0;
        break;
    }
  };

  const handlePossibleWords = async (matches: string[]) => {
    setPossibleWords(matches);
    setShowPossibleWords(true);

    // Wait for user selection
    const selectedWord = await new Promise<string>((resolve) => {
      const handleSelect = (selected: string) => {
        setShowPossibleWords(false);
        resolve(selected);
      };
      setOnSelectWord(() => handleSelect);
    });
    return selectedWord;
  };

  const validateConfirmedLetters = async () => {
    const noConfirmedLettersChanged = confirmedLetters.every((row, i) =>
      row.every((letter, j) =>
        letter === "" ? true : letters[i][j] === letter
      )
    );
    if (!noConfirmedLettersChanged) {
      console.log("Confirmed letters have changed");
    }
    //next we need to make sure that anything that has changed is either in a single row or column
    const changedLetters = letters.map((row, i) =>
      row.map((letter, j) => (letter !== confirmedLetters[i][j] ? letter : ""))
    );
    const seenCols = new Set();
    const seenRows = new Set();
    for (let i = 0; i < changedLetters.length; i++) {
      for (let j = 0; j < changedLetters[i].length; j++) {
        if (changedLetters[i][j] !== "") {
          seenCols.add(j);
          seenRows.add(i);
        }
      }
    }
    if (seenCols.size == 0) {
      console.log("No changes in a row or column");
    } else if (seenCols.size > 1 && seenRows.size > 1) {
      console.log("Changes are in multiple rows or columns");
      console.log("invalid board entry.");
    } else {
      //now we need to make sure that the changes are contiguous, but that may include letters from confirmedLetters
      let word: PlayedWord = new PlayedWord("", 0, -1, 1);
      let wordMultiplier = 1;
      let wordsPlayed: PlayedWord[] = [];
      let blanksSeen: number = 0;
      const movingHorizontal = seenRows.size == 1;
      let startPosition: number = -1;
      if (!movingHorizontal) {
        const col = seenCols.values().next().value;
        let rowStart = seenRows.values().next().value;
        while (letters[rowStart][col] !== "" && rowStart >= 0) {
          rowStart--;
        }
        rowStart++;
        startPosition = col;
        while (letters[rowStart][col] !== "" && rowStart < 15) {
          console.log("Current word: ", word);
          console.log("Current word multiplier: ", wordMultiplier);
          console.log("Current word value: ", word.value);
          if (seenRows.has(rowStart)) {
            //this is a new letter, so we need to check left and right here as well
            let sideWord: PlayedWord = new PlayedWord("", 0, -1, 1);
            let colStart = col;
            while (letters[rowStart][colStart] !== "" && colStart >= 0) {
              colStart--;
            }
            colStart++;
            while (letters[rowStart][colStart] !== "" && colStart < 15) {
              sideWord.word += letters[rowStart][colStart];
              if (letters[rowStart][colStart] === " ") {
                sideWord.blankIndex = blanksSeen;
              }
              if (colStart === col) {
                //check if this is on a special tile
                ModifyWordSpecialTile(sideWord, rowStart, colStart);
              } else {
                sideWord.value +=
                  tileValues.get(letters[rowStart][colStart]) ?? 0;
              }
              colStart++;
            }
            if (sideWord.word.length > 1) {
              sideWord.value *= sideWord.multiplier;
              wordsPlayed.push(sideWord);
              console.log("Side word: ", sideWord);
            }
          }
          word.word += letters[rowStart][col];
          if (letters[rowStart][col] === " ") {
            blanksSeen++;
          }
          if (confirmedLetters[rowStart][col] === "") {
            ModifyWordSpecialTile(word, rowStart, col);
            //check if this is on a special tile
          } else {
            //this letter was already played, so just add the value
            word.value += tileValues.get(letters[rowStart][col]) ?? 0;
          }
          rowStart++;
        }
      } else {
        const row = seenRows.values().next().value;
        let colStart = seenCols.values().next().value;
        while (letters[row][colStart] !== "" && colStart >= 0) {
          colStart--;
        }
        colStart++;
        startPosition = row;
        while (letters[row][colStart] !== "" && colStart < 15) {
          if (seenCols.has(colStart)) {
            let sideWord: PlayedWord = new PlayedWord("", 0, -1, 1);
            let rowStart = row;
            while (letters[rowStart][colStart] !== "" && rowStart >= 0) {
              rowStart--;
            }
            rowStart++;
            while (letters[rowStart][colStart] !== "" && rowStart < 15) {
              sideWord.word += letters[rowStart][colStart];
              if (letters[rowStart][colStart] === " ") {
                sideWord.blankIndex = blanksSeen;
              }
              if (rowStart === row) {
                //check if this is on a special tile
                ModifyWordSpecialTile(sideWord, rowStart, colStart);
              } else {
                sideWord.value +=
                  tileValues.get(letters[rowStart][colStart]) ?? 0;
              }
              rowStart++;
            }
            if (sideWord.word.length > 1) {
              sideWord.value *= sideWord.multiplier;
              wordsPlayed.push(sideWord);
              console.log("Side word: ", sideWord);
            }
          }
          word.word += letters[row][colStart];
          if (letters[row][colStart] === " ") {
            blanksSeen++;
          }
          if (confirmedLetters[row][colStart] === "") {
            ModifyWordSpecialTile(word, row, colStart);
          } else {
            word.value += tileValues.get(letters[row][colStart]) ?? 0;
          }
          colStart++;
        }
      }
      console.log("Words played: ", wordsPlayed);
      console.log("Base word value: ", word.value);
      console.log("Word multiplier: ", word.multiplier);
      word.value *= word.multiplier;
      //let newLetters = JSON.parse(JSON.stringify(letters));
      if (word.word.length === 1 && wordsPlayed.length ===1) {
        word = wordsPlayed[0];
        wordsPlayed = [];
      }
      if (blanksSeen > 0) {
        const regex = new RegExp(`^${word.word.replace(/\s/g, "[a-zA-Z]")}$`);
        console.log("Regex: ", regex);
        //find all words in the dictionary that match the regex
        const matches = Array.from(dictionary).filter((entry) =>
          regex.test(entry)
        );
        const originalWord = word.word;
        if (matches.length > 1) {
          const chosenWord = await handlePossibleWords(matches);
          console.log("Chosen word: ", chosenWord);
          word.word = chosenWord;
        } else if (matches.length === 1) {
          word.word = matches[0];
        } else {
          console.log("No valid words found");
          return;
        }
        let LocalBlankMap: Map<number, string> = new Map();
        for (let i = 0; i < originalWord.length; i++) {
          if (originalWord[i] === " ") {
            LocalBlankMap.set(LocalBlankMap.size, word.word[i]);
            if (movingHorizontal) {
              // newLetters[startPosition][seenCols.values().next().value + i] =
              //   word.word[i];
              let tempBlankMap = blankMap;
              tempBlankMap.set(
                startPosition * 15 + seenCols.values().next().value + i,
                word.word[i]
              );
              setBlankMap(tempBlankMap);
            } else {
              // newLetters[seenRows.values().next().value + i][startPosition] =
              //   word.word[i];
              let tempBlankMap = blankMap;
              tempBlankMap.set(
                (seenRows.values().next().value + i) * 15 + startPosition,
                word.word[i]
              );
              setBlankMap(tempBlankMap);
            }
          }
        }
        //console.log("New letters: ", newLetters);
        console.log("Blank map: ", LocalBlankMap);

        //now go through the side words and replace the blanks with the correct letters
        for (let i = 0; i < wordsPlayed.length; i++) {
          let sideWord = wordsPlayed[i];
          if (sideWord.blankIndex !== -1) {
            const blankLetter = blankMap.get(sideWord.blankIndex);
            if (blankLetter !== undefined) {
              sideWord.word = sideWord.word.replace(" ", blankLetter);
            } else {
              console.log("ERROR: Blank letter not found");
            }
          }
          wordsPlayed[i] = sideWord;
        }
        wordsPlayed.push(word);
      } else {
        wordsPlayed.push(word);
      }
      let turnScore = 0;
      console.log("Words played: ", wordsPlayed);
      for (const word of wordsPlayed) {
        if (!dictionary.has(word.word)) {
          console.log("Invalid word: ", word);
          return;
        }
        console.log("Word: ", word);
        turnScore += word.value;
        console.log("Turn score: ", turnScore);
      }
      let moveString = `Player ${player} played `;
      for (const word of wordsPlayed) {
        moveString += `${word.word} `;
      }
      moveString += `for a total of ${turnScore} points.`;
      moveHistory.push(moveString);
      
      console.log("Valid words: ", wordsPlayed);
      console.log("Turn Score: ", turnScore);
      setConfirmedLetters(JSON.parse(JSON.stringify(letters)));
      setLetters(JSON.parse(JSON.stringify(letters)));
      setLettersNeedConfirmation(false);
      players[player].score += turnScore;
      setPlayer((player + 1) % players.length);
    }
  };
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleClickedTile = (rowIndex: number, colIndex: number) => {
    if (selectedTile?.row === rowIndex && selectedTile?.col === colIndex) {
      setTypingDirection("horizontal");
    } else {
      setTypingDirection("vertical");
    }
    setSelectedTile({ row: rowIndex, col: colIndex });
  };

  return (
    <div className="flex flex-row items-center">
      {gameStarted ? (
        <div className="flex flex-row items-center ">
          <div>
            <div className="grid grid-rows-15  sm:gap-0 grid-cols-15 ">
              {letters.map((row, rowIndex) =>
                row.map((_, colIndex) => (
                  <Tile
                    key={`${rowIndex},${colIndex}`}
                    letters={letters}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    blankMap={blankMap}
                    typingDirection={typingDirection}
                    isSelected={
                      selectedTile?.row === rowIndex &&
                      selectedTile?.col === colIndex
                    }
                    onClick={() => {
                      handleClickedTile(rowIndex, colIndex);
                    }}
                  />
                ))
              )}
            </div>
          </div>
          {showPossibleWords && (
            <PossibleWordsModal
              words={possibleWords}
              onSelect={onSelectWord}
              onClose={() => setShowPossibleWords(false)}
            />
          )}
          <div className="">
            {takingPicture ? (
              <Camera
                badPhoto={badPhoto}
                setBadPhoto={setBadPhoto}
                confirmedLetters={confirmedLetters}
                takingPicture={takingPicture}
                setTakingPicture={setTakingPicture}
                letters={letters}
                setLetters={setLetters}
              />
            ) : (
              <div>
                <div>
                  {moveHistory.map((move, idx) => (
                    <div key={idx}>{move}</div>
                  ))}
                </div>
                <button
                  className="rouned-md bg-blue-800 m-1"
                  onClick={() => {
                    setTakingPicture(true);
                  }}
                >
                  Take Picture
                </button>
                {lettersNeedConfirmation && (
                  <button
                    className="rouned-md bg-green-500 m-1"
                    onClick={() => {
                      validateConfirmedLetters();
                    }}
                  >
                    Confirm Board
                  </button>
                )}
              </div>
            )}
            <div>
              {players.map((person, idx) => (
                <div
                  key={idx}
                  className="flex flex-row items-center justify-center gap-1"
                >
                  <div className="flex items-center justify-center w-10 h-10 align-middle">
                    <IoPersonSharp className="text-4xl" />
                  </div>
                  <div>
                    Name:{" "}
                    <span
                      className={`font-bold ${
                        idx === player ? "text-green-500" : ""
                      }`}
                    >
                      {person.name}
                    </span>
                  </div>
                  <div className="text-center">Score: {person.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          {players.map((player, key) => (
            <div
              key={key}
              className="flex flex-row items-center justify-center gap-1"
            >
              <div className="flex items-center justify-center w-10 h-10 align-middle">
                <IoPersonSharp className="text-4xl" />
              </div>
              {/* allow user to change name */}
              <input
                className="text-center"
                type="text"
                value={player.name}
                onChange={(e) => {
                  const newPlayers = [...players];
                  newPlayers[players.indexOf(player)].name = e.target.value;
                  setPlayers(newPlayers);
                }}
              />
              <div>
                <button
                  className="bg-transparent text-red-500 p-0 flex items-center justify-center w-10 h-10 align-middle"
                  onClick={() => {
                    const newPlayers = [...players];
                    newPlayers.splice(players.indexOf(player), 1);
                    setPlayers(newPlayers);
                  }}
                >
                  <CiCircleRemove className="text-3xl" />
                </button>
              </div>
            </div>
          ))}
          {players.length < 4 && (
            <button
              className="m-2"
              onClick={() => {
                const newPlayers = [...players];
                newPlayers.push({ name: "Player", score: 0 });
                setPlayers(newPlayers);
              }}
            >
              Add Player
            </button>
          )}
          {players.length > 1 && (
            <button onClick={() => setGameStarted(true)}>Start Game</button>
          )}
        </div>
      )}
    </div>
  );
};

export default Board;
