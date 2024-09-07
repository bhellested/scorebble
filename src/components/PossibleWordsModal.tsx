import React from "react";

interface WordSelectionModalProps {
  words: string[];
  onSelect: (wordIndex: string) => void;
  onClose: () => void;
}

const PossibleWordsModal: React.FC<WordSelectionModalProps> = ({
  words,
  onSelect,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-black">
          Multiple Possible Matches Found
        </h2>
        <p className=" font-bold mb-4 text-black">Please Select a word</p>
        <ul>
          {words.map((word, index) => (
            <li key={index} className="mb-2">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => onSelect(word)}
              >
                {word}
              </button>
            </li>
          ))}
        </ul>
        <button
          className="mt-4 bg-gray-300 px-4 py-2 rounded"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PossibleWordsModal;
