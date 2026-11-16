import { useCallback, useRef, useState } from "react";
import { ParticleTreeScene } from "./components/ParticleTreeScene";
import { HandControl } from "./components/HandControl";
import { WishComposer } from "./components/WishComposer";
import { useHandGestures } from "./hooks/useHandGestures";
import { useIsMobile } from "./hooks/useIsMobile";
import type { Wish } from "./types";

export default function App() {
  const isMobile = useIsMobile();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wishEnergy, setWishEnergy] = useState(0);
  const [notice, setNotice] = useState("");
  const nextWishId = useRef(1);
  const noticeTimer = useRef<number | null>(null);
  const {
    videoRef,
    enabled,
    setEnabled,
    status,
    gesture,
    handX,
    scaleTarget,
  } = useHandGestures();

  const sendWish = (message: string) => {
    const id = nextWishId.current++;
    setWishes((current) => [
      ...current,
      {
        id,
        message,
        offsetX: Math.sin(id * 2.17) * 0.62,
      },
    ]);
    setNotice("YOUR WISH IS ON ITS WAY");

    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => {
      setNotice("");
    }, 3200);
  };

  const wishArrived = useCallback(() => {
    setWishEnergy((current) => current + 1);
    setNotice("WISH RECEIVED · KEEP LOOKING UP");
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2600);
  }, []);

  const wishComplete = useCallback((id: number) => {
    setWishes((current) => current.filter((wish) => wish.id !== id));
  }, []);

  return (
    <main className="experience">
      <div className="ambient-field" aria-hidden="true">
        <span className="ambient-orb ambient-orb-one" />
        <span className="ambient-orb ambient-orb-two" />
        <span className="ambient-grid" />
      </div>

      <ParticleTreeScene
        isMobile={isMobile}
        handX={handX}
        scaleTarget={scaleTarget}
        wishes={wishes}
        wishEnergy={wishEnergy}
        onWishArrival={wishArrived}
        onWishComplete={wishComplete}
      />

      <div className="interface">
        <header className="topbar">
          <a className="brand" href="#" aria-label="Noël 2026 home">
            <span className="brand-star" aria-hidden="true">
              ✦
            </span>
            <span>
              <span className="brand-title">NOËL</span>
              <span className="brand-edition">OBJECT 01 · 2026</span>
            </span>
          </a>

          <HandControl
            videoRef={videoRef}
            enabled={enabled}
            status={status}
            gesture={gesture}
            scaleTarget={scaleTarget}
            onToggle={() => setEnabled((current) => !current)}
          />
        </header>

        <section className="hero-copy" aria-labelledby="page-title">
          <p className="eyebrow">
            <span className="eyebrow-line" />
            A WISH IN LIGHT
          </p>
          <h1 id="page-title">
            <span>MERRY</span>
            <span>CHRISTMAS</span>
          </h1>
          <p className="hero-note">
            A tree made of ten thousand glowing promises.
          </p>
        </section>

        <div className="side-note" aria-hidden="true">
          <span>25 · XII · 2026</span>
          <span className="side-note-rule" />
          <span>PINK / GOLD / INFINITE</span>
        </div>

        <div className={`wish-notice ${notice ? "is-visible" : ""}`} role="status">
          <span className="notice-star" aria-hidden="true">
            ✦
          </span>
          {notice}
        </div>

        <div className="wish-dock">
          <WishComposer onWish={sendWish} />
        </div>

        <footer className="footer">
          <div className="interaction-hint">
            <span className="hint-icon" aria-hidden="true">
              ↔
            </span>
            <span>DRAG TO ORBIT</span>
            <span className="hint-divider">/</span>
            <span>SCROLL TO FOCUS</span>
          </div>
          <span className="live-mark">
            <span className="live-dot" />
            MADE OF LIGHT
          </span>
        </footer>
      </div>

      <div className="screen-grain" aria-hidden="true" />
      <div className="screen-edge" aria-hidden="true" />
    </main>
  );
}

