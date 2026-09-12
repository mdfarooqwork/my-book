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
      className="font-display italic text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-light tracking-tight text-foreground select-none leading-[1.1]"
    >
      <span aria-hidden="true">
        {displayed}
        <span
          className={`inline-block w-[1.5px] h-[0.75em] align-baseline ml-1 bg-primary/70 transition-opacity duration-300 ${
            isDone ? "animate-pulse opacity-60" : "opacity-100"
          }`}
        />
      </span>
    </h1>
  );
};
