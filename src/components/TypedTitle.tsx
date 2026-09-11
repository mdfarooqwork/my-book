import React, { useEffect, useState } from "react";

const FULL = "Welcome to my library";

export const TypedTitle: React.FC = () => {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setDisplayed(FULL.slice(0, index));
      if (index >= FULL.length) {
        setIsDone(true);
        clearInterval(interval);
      }
    }, 95);

    return () => clearInterval(interval);
  }, []);

  return (
    <h1
      id="library-title"
      aria-label={FULL}
      className="font-display italic text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-foreground select-none"
    >
      <span aria-hidden="true">
        {displayed}
        <span
          className={`inline-block w-[2px] h-[0.85em] align-baseline ml-1.5 bg-primary transition-opacity duration-300 ${
            isDone ? "animate-pulse opacity-70" : "opacity-100"
          }`}
        />
      </span>
    </h1>
  );
};
