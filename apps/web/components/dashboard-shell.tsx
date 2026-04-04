"use client";

import Link from "next/link";
import { AuthPanel } from "./auth-panel";
import { demoChildren, demoRoutines, demoWeeklyProgress } from "../lib/demo-data";
import { useAuthUser } from "../lib/use-auth-user";

export function DashboardShell() {
  const user = useAuthUser();
  const isTrainer = user?.role === "TRAINER";
  const isAdmin = user?.role === "ADMIN";
  const isParent = user?.role === "PARENT";
  const completed = demoWeeklyProgress.reduce((sum, item) => sum + item.completedSessions, 0);
  const target = demoWeeklyProgress.reduce((sum, item) => sum + item.targetSessions, 0);
  const progressPercent = target === 0 ? 0 : Math.round((completed / target) * 100);

  function logout() {
    window.localStorage.removeItem("tsmt.accessToken");
    window.localStorage.removeItem("tsmt.refreshToken");
    window.localStorage.removeItem("tsmt.user");
    window.dispatchEvent(new Event("tsmt-auth-changed"));
    window.location.reload();
  }

  if (!user) {
    return (
      <div className="landing-shell">
        <section className="landing-hero">
          <div className="landing-hero-overlay">
            <div className="landing-left-stack">
              <div className="landing-copy">
                <span className="eyebrow">Otthoni TSMT kísérő</span>
                <h1>Gyermekbarát keret az otthoni TSMT gyakorlásokhoz.</h1>
                <p>
                  Segít, hogy a gyerek értse, mi történik, lássa hol tart a folyamatban, és motiválóbb legyen
                  végigcsinálni a feladatsort. A szülő közben nyugodtabban, átláthatóbban tudja kísérni az
                  alkalmat.
                </p>
              </div>

              <div className="landing-auth-card" id="auth">
                <AuthPanel embedded />
              </div>
            </div>
          </div>
        </section>

        <section className="landing-values">
          <div className="landing-value-card">
            <strong>A gyerek látja a haladást</strong>
            <span className="muted">Az aktuális feladat, a következő lépés és az előrehaladás vizuálisan is követhető.</span>
          </div>
          <div className="landing-value-card">
            <strong>Motiválóbb végigcsinálni</strong>
            <span className="muted">A kiszámítható keret és a látható haladás sikerélményt ad az otthoni gyakorlásban.</span>
          </div>
          <div className="landing-value-card">
            <strong>A trainer is követheti</strong>
            <span className="muted">Másodlagos extra, hogy a megosztott rutinok előrehaladása a trainer számára is látható.</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="shell">
      <section className="hero">
        <div className="hero-card">
          <span className="eyebrow">TSMT Trainer SaaS alap</span>
          <h1>Gyerekbarat edzeselmeny, szuloknek es trainereknek epitett rendszerrel.</h1>
          <p>
            Ez az elso projektvaz mar a tobb gyerekes accountot, a feladatsor-idoszakokat, a heti
            teljesitesi celokat es a kesobbi mobilos API-first mukodest veszi alapul.
          </p>
          <div className="cta-row">
            {!isTrainer ? (
              <>
                <Link href="/children" className="button primary">
                  Gyerekek kezelese
                </Link>
                <Link href="/routines" className="button secondary">
                  Feladatsorok es idoszakok
                </Link>
              </>
            ) : null}
            {isTrainer ? (
              <Link href="/trainer" className="button secondary">
                Trainer nezet
              </Link>
            ) : null}
            {isAdmin ? (
              <Link href="/admin" className="button secondary">
                Admin felulet
              </Link>
            ) : null}
          </div>
        </div>

        <aside className="panel">
          <h2>Heti celkovetes</h2>
          <p className="muted">
            Az MVP egyik fo funkcioja, hogy az idoszakon beluli heti elvart darabszam es a tenyleges
            teljesites elso rangu adat legyen.
          </p>
          <div className="badge">Osszesitett heti allas: {completed} / {target}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="muted">Teljesitesi arany: {progressPercent}%</p>
        </aside>
      </section>

      <section className="metric-grid">
        <div className="metric">
          <div className="label">Kezelt gyerekek</div>
          <div className="value">{demoChildren.length}</div>
        </div>
        <div className="metric">
          <div className="label">Aktiv feladatsorok</div>
          <div className="value">{demoRoutines.length}</div>
        </div>
        <div className="metric">
          <div className="label">Badge szabalyok</div>
          <div className="value">6</div>
        </div>
        <div className="metric">
          <div className="label">API vegpontok elso kore</div>
          <div className="value">7</div>
        </div>
      </section>

      <section className="nav-row">
        {!isTrainer ? (
          <>
            <Link href="/children" className="panel">
              <h2>Children domain</h2>
              <p className="muted">Tobb gyerek egy fiok alatt, sajat feladatsorokkal es statistikakkal.</p>
            </Link>
            <Link href="/routines" className="panel">
              <h2>Routine domain</h2>
              <p className="muted">Feladatok, periodusok, heti celok es kesobbi media hozzarendeles.</p>
            </Link>
          </>
        ) : null}
        {isTrainer ? (
          <Link href="/trainer" className="panel">
            <h2>Trainer domain</h2>
            <p className="muted">Read-only terapeuta nezet a hozzarendelt gyerekekhez, rutinokhoz es eredmenyekhez.</p>
          </Link>
        ) : isAdmin ? (
          <Link href="/admin" className="panel">
            <h2>Admin domain</h2>
            <p className="muted">Felhasznalok, rutinok es sessionok kozponti kezelese admin szerepkorrel.</p>
          </Link>
        ) : (
          <div className="panel">
            <h2>Megosztas trainerrel</h2>
            <p className="muted">A rutinokat a trening oldalon tudod egy trainer emaillel megosztani.</p>
          </div>
        )}
      </section>

      <section className="nav-row">
        <a href="http://localhost:4000/api/docs" className="panel">
          <h2>OpenAPI docs</h2>
          <p className="muted">A webtol fuggetlen, mobilbarat REST API dokumentacioja.</p>
        </a>
        {!isTrainer ? (
          <div className="panel">
            <h2>Szuloi flow</h2>
            <p className="muted">Gyerek letrehozasa, rutin szerkesztes, session inditas, trainer megosztas.</p>
          </div>
        ) : null}
        {isTrainer ? (
          <div className="panel">
            <h2>Trainer flow</h2>
            <p className="muted">Trainer role-lal regisztralva a /trainer oldalon lathatok a hozzad rendelt esetek.</p>
          </div>
        ) : isAdmin ? (
          <div className="panel">
            <h2>Admin flow</h2>
            <p className="muted">Admin szerepkorrel a /admin oldalon kezelheted a usereket, rutinokat es sessionoket.</p>
          </div>
        ) : (
          <div className="panel">
            <h2>Szuloi flow</h2>
            <p className="muted">Szülőként gyereket és rutint kezelsz, sessiont indítasz, és igény esetén trainerrel osztod meg a rutint.</p>
          </div>
        )}
      </section>

      <section className="list-grid">
        <div className="list-card">
          <h2>Bejelentkezve</h2>
          <div className="list" style={{ marginTop: 12 }}>
            <div className="list-item">
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              <span className="muted">{user.email}</span>
              <span className="muted">
                Szerepkor: {user.role === "PARENT" ? "Szulo" : user.role === "TRAINER" ? "Trainer" : "Admin"}
              </span>
              <button className="button secondary" onClick={logout} type="button">
                Kijelentkezes
              </button>
            </div>
          </div>
        </div>
        {!isTrainer ? (
          <div className="list-card">
            <h2>Gyerekek</h2>
            <div className="list">
              {demoChildren.map((child) => (
                <div key={child.id} className="list-item">
                  <strong>
                    {child.firstName} {child.lastName}
                  </strong>
                  <span className="muted">Sajat rutinokkal es badge progressionnel.</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="list-card">
          <h2>Heti haladas minta</h2>
          <div className="list">
            {demoWeeklyProgress.map((entry) => {
              const entryProgress = Math.round((entry.completedSessions / entry.targetSessions) * 100);
              return (
                <div key={entry.weekStart} className="list-item">
                  <strong>
                    {entry.weekStart} - {entry.weekEnd}
                  </strong>
                  <span className="muted">
                    {entry.completedSessions} / {entry.targetSessions} alkalom
                  </span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${entryProgress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {isTrainer ? (
          <div className="list-card">
            <h2>Trainer kiprobalas</h2>
            <div className="list">
              <div className="list-item">
                <strong>1. Regisztracio TRAINER szerepkorrel</strong>
                <span className="muted">A fooldalon a regisztracios formban mar valaszthato a trainer szerepkor.</span>
              </div>
              <div className="list-item">
                <strong>2. Trainer dashboard</strong>
                <span className="muted">A hozzarendelt rutinok a /trainer oldalon jelennek meg.</span>
              </div>
            </div>
          </div>
        ) : isAdmin ? (
          <div className="list-card">
            <h2>Admin kiprobalas</h2>
            <div className="list">
              <div className="list-item">
                <strong>1. Bejelentkezes admin userrel</strong>
                <span className="muted">Az admin user a /admin oldalon kezelheti a rendszer adatait.</span>
              </div>
              <div className="list-item">
                <strong>2. User management</strong>
                <span className="muted">Nev, email, jelszo es role modosithato, user torolheto.</span>
              </div>
              <div className="list-item">
                <strong>3. Parent-child szures</strong>
                <span className="muted">Feladatsorok es sessionok logikus szuloi/gyerek szurovel nezhetok.</span>
              </div>
            </div>
          </div>
        ) : isParent ? (
          <div className="list-card">
            <h2>Szuloi kovetkezo lepesek</h2>
            <div className="list">
              <div className="list-item">
                <strong>1. Gyerek letrehozasa</strong>
                <span className="muted">A Gyerekek oldalon hozhatsz letre uj gyereket.</span>
              </div>
              <div className="list-item">
                <strong>2. Rutin es media beallitasa</strong>
                <span className="muted">A Feladatsorok oldalon epithetsz rutinokat taskokkal es media linkekkel.</span>
              </div>
              <div className="list-item">
                <strong>3. Trainer megosztas</strong>
                <span className="muted">A trening oldalon email alapjan megoszthatod a rutint egy trainerrel.</span>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
