export default function ParentsInfoPage() {
  return (
    <main className="shell">
      <section className="panel">
        <span className="eyebrow">Szuloknek</span>
        <h1 className="hero-title">Segitseg az otthoni TSMT gyakorlashoz.</h1>
        <p className="muted">
          Ez az oldal kesobb reszletesen bemutatja majd, hogyan segit a rendszer a napi torna vegigviteleben,
          a gyerek motivaciojaban es az otthoni gyakorlashoz szukseges nyugodtabb keret megteremteseben.
        </p>
      </section>

      <section className="list-grid">
        <div className="list-card">
          <h2>Mi lesz itt a fokusz</h2>
          <div className="list">
            <div className="list-item">
              <strong>Gyermekbarat gyakorlasi elmeny</strong>
              <span className="muted">Hogyan segit a vizualis haladas es a feladatok ertheto kerete a motivacioban.</span>
            </div>
            <div className="list-item">
              <strong>Szuloi tamogatas</strong>
              <span className="muted">Hogyan lesz kevesebb ellenallas es atlathatobb a kozos otthoni gyakorlasi folyamat.</span>
            </div>
            <div className="list-item">
              <strong>Eredmenyek kovetese</strong>
              <span className="muted">Sessionok, heti celok, rekordok es kesobbi trainer megosztas ertelmezese.</span>
            </div>
          </div>
        </div>

        <div className="list-card">
          <h2>Kesobb bovitjuk</h2>
          <p className="muted">
            Ide kerul majd a szuloi use case-ek, tipikus napi helyzetek es a fo funkciok reszletesebb,
            emberkozpontu bemutatasa.
          </p>
        </div>
      </section>
    </main>
  );
}
