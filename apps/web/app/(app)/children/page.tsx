import { ChildrenManager } from "../../../components/children-manager";

export default function ChildrenPage() {
  return (
    <main className="shell">
      <div className="panel">
        <h1>Gyerekek</h1>
        <p className="muted">
          Elso UI vaz a tobb gyerekes accountmodellhez. A kovetkezo korben ezt mar valodi API
          lista fogja kiszolgalni.
        </p>
      </div>

      <section className="nav-row">
        <div className="panel">
          <h2>Szuloi nezet</h2>
          <p className="muted">Itt kezeled a gyerekeket, akikhez majd rutinok, sessionok es badge-ek tartoznak.</p>
        </div>
        <div className="panel">
          <h2>Kapcsolodo oldalak</h2>
          <p className="muted">A feladatsorokat a Feladatsorok oldalon, a trainer megosztast a trening oldalon ered el.</p>
        </div>
        <div className="panel">
          <h2>Trainer nezet</h2>
          <p className="muted">Ha egy trainernek megosztottad a rutint, o a /trainer oldalon fogja latni.</p>
        </div>
      </section>

      <ChildrenManager />
    </main>
  );
}
