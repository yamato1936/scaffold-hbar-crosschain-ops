import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">Scaffold-HBAR template</div>
        <h1>Send across chains. Know exactly what happened.</h1>
        <p className="lede">
          A replayable operations ledger and reconciliation layer for Axelar-powered Hedera applications.
          HCS preserves ordered lifecycle facts; Axelar provides independent cross-chain delivery evidence.
        </p>
        <div className="actions">
          <Link className="button primary" href="/operations">
            Explore demo operations
          </Link>
          <a className="button" href="/api/operations">
            Open JSON API
          </a>
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">The missing layer</div>
        <h2>Bridge starters teach sending. This starter teaches operating.</h2>
        <div className="grid">
          <article className="card">
            <h3>Immutable history</h3>
            <p>Lifecycle facts are written to HCS and replayed in consensus sequence order through Mirror Node.</p>
          </article>
          <article className="card">
            <h3>Queryable state</h3>
            <p>A deterministic reducer turns the append-only event stream into application-friendly current state.</p>
          </article>
          <article className="card">
            <h3>Independent reconciliation</h3>
            <p>Axelar GMP status is compared with ledger-derived state. Disagreements are surfaced instead of hidden.</p>
          </article>
        </div>
      </section>
    </>
  );
}
