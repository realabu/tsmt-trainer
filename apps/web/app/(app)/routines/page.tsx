import { RoutinesManager } from "../../../components/routines-manager";

export default function RoutinesPage() {
  return (
    <main className="shell">
      <div className="panel">
        <h1>Feladatsorok es periodusok</h1>
        <p className="muted">
          A heti teljesites kovetese a rutinokhoz tartozo idoszakokbol szamolodik, nem utolagos
          statisztikai hack.
        </p>
      </div>

      <section className="nav-row">
        <div className="panel">
          <h2>Szuloi munkafelulet</h2>
          <p className="muted">Itt hozhatsz letre rutinokat, periodusokat, mediakat es innen indithato az edzes.</p>
        </div>
        <div className="panel">
          <h2>Edzes es megosztas</h2>
          <p className="muted">Az Edzes inditasa gomb utan a training oldalon mar trainerhez is megoszthato a rutin.</p>
        </div>
        <div className="panel">
          <h2>Trainer betekintes</h2>
          <p className="muted">A trainer dashboard read-only modban latja majd a session eredmenyeket es badge-eket.</p>
        </div>
      </section>

      <RoutinesManager />
    </main>
  );
}
