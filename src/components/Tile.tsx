import React from "react";
import specialTiles from "../extras/SpecialTiles";
import tileValues from "../extras/TileValues";
interface Props {
  letters: string[][];
  rowIndex: number;
  colIndex: number;
  blankMap: Map<number, string>;
  onClick?: () => void;
  typingDirection: string;
  isSelected: boolean;
}

const Tile = (props: Props) => {
  const { rowIndex, colIndex, letters, typingDirection, isSelected,blankMap } = props;
  const letter = letters[rowIndex][colIndex];
  const hasLetter = letter !== "";
  let tile = specialTiles.get(`${rowIndex},${colIndex}`);
  const tileValue = hasLetter ? tileValues.get(letter) : null;
  if (!tile) {
    tile = "";
  }
  const blankTile = blankMap.get(rowIndex * 15 + colIndex);
  return (
    <div className="relative w-10 h-10">
      <div
        onClick={props.onClick}
        key={`${rowIndex},${colIndex}`}
        className={`${
          !hasLetter
            ? tile === "TW"
              ? "bg-red-500"
              : tile === "DL"
              ? "bg-blue-500"
              : tile === "TL"
              ? "bg-yellow-500"
              : tile === "DW"
              ? "bg-green-500"
              : "bg-white"
            : "bg-orange-300 text-black text-2xl sm:text-lg"
        } ${
          isSelected ? "border-4 border-red-500 animate-pulse" : ""
        }
        ${
          blankTile ? "text-red-500" : ""
        } border w-full h-full border-black justify-center items-center flex`}
      >
        {blankTile ? blankTile : hasLetter ? letter : tile}
      </div>
      {isSelected && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 text-white">
          {typingDirection === "horizontal" ? "→" : "↓"}
        </div>
      )}
      {tileValue && (
        <div className="absolute bottom-0 right-0 text-xs font-bold p-0.5  text-black rounded-tl">
          {tileValue}
        </div>
      )}
    </div>
  );
};
export default Tile;