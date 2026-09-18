"use client";

import { useState } from "react";
import { type City, searchCities } from "@/lib/cities";

interface GuessInputProps {
  onSelect: (city: City) => void;
  disabled?: boolean;
  guessCount: number;
  maxGuesses: number;
}

// Mockup screens 01 & 02: "Typ een stad…" input with a grouped autocomplete dropdown.
// FR-021: selecting a suggestion submits it immediately — no separate confirm step.
export function GuessInput({
  onSelect,
  disabled,
  guessCount,
  maxGuesses,
}: GuessInputProps) {
  const [query, setQuery] = useState("");
  const suggestions = query.trim() ? searchCities(query) : [];

  function handleSelect(city: City) {
    onSelect(city);
    setQuery("");
  }

  return (
    <div className="guess-input">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Typ een stad…"
        disabled={disabled}
        aria-label="Typ een stad"
        autoComplete="off"
      />
      <span className="guess-input__count">
        {guessCount}/{maxGuesses}
      </span>
      {suggestions.length > 0 && (
        <div className="guess-input__suggestions" role="listbox">
          {suggestions.map((city) => (
            <button
              key={city.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(city)}
            >
              <span className="guess-input__name">{city.name}</span>
              <span className="guess-input__province">{city.province}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
