export default function TrainersInfoPage() {
  return (
    <main className="shell">
      <section className="panel">
        <span className="eyebrow">Trainereknek</span>
        <h1 className="hero-title">Attekintheto betekintes a megosztott otthoni gyakorlasba.</h1>
        <p className="muted">
          Ez az oldal kesobb reszletesen bemutatja majd, hogyan kovetheti a trainer a megosztott rutinokat,
          a session eredmenyeket es a fejlodes fo jeleit anelkul, hogy a szuloi elmeny kerulne hatterbe.
        </p>
      </section>

      <section className="list-grid">
        <div className="list-card">
          <h2>Mi lesz itt a fokusz</h2>
          <div className="list">
            <div className="list-item">
              <strong>Megosztott rutinok attekintese</strong>
              <span className="muted">Melyik szulo, melyik gyerek es melyik rutin van a trainerrel megosztva.</span>
            </div>
            <div className="list-item">
              <strong>Session eredmenyek</strong>
              <span className="muted">A befejezett alkalmak es az elorehaladas letisztult, read-only kovetese.</span>
            </div>
            <div className="list-item">
              <strong>Kesobbi bovitesi lehetosegek</strong>
              <span className="muted">A szulo altal rogzitheto plusz informaciok es visszajelzesek fogadasa.</span>
            </div>
          </div>
        </div>

        <div className="list-card">
          <h2>Kesobb bovitjuk</h2>
          <p className="muted">
            Ide kerul majd a trainer szerepkorhoz tartozo use case-ek es a rendszer read-only szakmai kovetesi
            funkcioinak reszletesebb bemutatasa.
          </p>
        </div>
      </section>
    </main>
  );
}
