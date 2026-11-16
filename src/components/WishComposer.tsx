import { useState, type FormEvent } from "react";

interface WishComposerProps {
  onWish: (message: string) => void;
}

export function WishComposer({ onWish }: WishComposerProps) {
  const [wish, setWish] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = wish.trim();
    if (!message) return;
    onWish(message);
    setWish("");
  };

  return (
    <form className="wish-composer" onSubmit={submit}>
      <div className="wish-heading-row">
        <label className="wish-heading" htmlFor="wish-input">
          MAKE A WISH
        </label>
        <span className="wish-counter">{String(wish.length).padStart(2, "0")} / 64</span>
      </div>
      <div className="wish-field">
        <input
          id="wish-input"
          className="wish-input"
          type="text"
          value={wish}
          maxLength={64}
          autoComplete="off"
          spellCheck={false}
          placeholder="Leave a little light in the world..."
          onChange={(event) => setWish(event.target.value)}
        />
        <button className="wish-send" type="submit" disabled={!wish.trim()}>
          SEND
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </form>
  );
}

