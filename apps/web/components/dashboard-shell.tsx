"use client";

import Link from "next/link";
import { AuthPanel } from "./auth-panel";
import { useAuthUser } from "../lib/use-auth-user";
import { ParentDashboard } from "./parent-dashboard";

export function DashboardShell() {
  const user = useAuthUser();
  const isTrainer = user?.role === "TRAINER";
  const isAdmin = user?.role === "ADMIN";
  const isParent = user?.role === "PARENT";

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
            <span className="muted">Másodlagos extra, hogy a megosztott feladatsorok elorehaladasa a trainer szamara is lathato.</span>
          </div>
        </section>
      </div>
    );
  }

  if (isParent) {
    return <ParentDashboard />;
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
          <h2>Szerepkor alapu attekintes</h2>
          <p className="muted">
            Ezen a role-specifikus home nezeten a trainer es az admin gyors belépőfelületet kap a saját moduljaihoz.
          </p>
        </aside>
      </section>

      <section className="nav-row">
        {!isTrainer ? (
          <>
            <Link href="/routines" className="panel">
              <h2>Feladatsor domain</h2>
              <p className="muted">Feladatok, periodusok, heti celok es a trainer-megosztas adminisztracioja.</p>
            </Link>
          </>
        ) : null}
        {isTrainer ? (
          <Link href="/trainer" className="panel">
            <h2>Trainer domain</h2>
            <p className="muted">Read-only terapeuta nezet a hozzarendelt gyerekekhez, feladatsorokhoz es eredmenyekhez.</p>
          </Link>
        ) : isAdmin ? (
          <Link href="/admin" className="panel">
            <h2>Admin domain</h2>
            <p className="muted">Felhasznalok, feladatsorok es tornak kozponti kezelese admin szerepkorrel.</p>
          </Link>
        ) : (
          <div className="panel">
            <h2>Megosztas trainerrel</h2>
            <p className="muted">A feladatsorokat a trening oldalon tudod egy trainer emaillel megosztani.</p>
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
            <p className="muted">Gyerek letrehozasa, feladatsor szerkesztes, torna inditas, trainer megosztas.</p>
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
            <p className="muted">Admin szerepkorrel a /admin oldalon kezelheted a usereket, feladatsorokat es tornakat.</p>
          </div>
        ) : null}
      </section>

      <section className="list-grid">
        <div className="list-card">
          <h2>Sajat fiok</h2>
          <div className="list" style={{ marginTop: 12 }}>
            <div className="list-item">
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              <span className="muted">{user.email}</span>
              <span className="muted">
                Szerepkor: {user.role === "PARENT" ? "Szulo" : user.role === "TRAINER" ? "Trainer" : "Admin"}
              </span>
              <Link href="/profile" className="button secondary">
                Profil szerkesztese
              </Link>
            </div>
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
                <span className="muted">A hozzarendelt feladatsorok a /trainer oldalon jelennek meg.</span>
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
                <span className="muted">Feladatsorok es tornak logikus szuloi/gyerek szurovel nezhetok.</span>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
