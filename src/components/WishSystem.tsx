import { WishParticle } from "./WishParticle";
import type { Wish } from "../types";

interface WishSystemProps {
  wishes: Wish[];
  onArrival: () => void;
  onComplete: (id: number) => void;
}

export function WishSystem({
  wishes,
  onArrival,
  onComplete,
}: WishSystemProps) {
  return (
    <>
      {wishes.map((wish) => (
        <WishParticle
          key={wish.id}
          wish={wish}
          onArrival={onArrival}
          onComplete={onComplete}
        />
      ))}
    </>
  );
}

