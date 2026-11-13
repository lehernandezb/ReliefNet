/**
 * Page frame used by every screen:
 *   title card  ->  key figures  ->  section tabs  ->  content (+ optional side column)
 *
 *   <Page title="Bow River Flood" tint="#a3242b"
 *         crumbs={<Link to="/dispatcher">Emergencies</Link>}
 *         sub={<>Flood in Sunnyside</>}
 *         stats={[['Teams assigned', 2], ['Evacuation zones', 2]]}
 *         sections={[['assignments', 'Assignments'], ['zones', 'Evacuation zones']]}
 *         aside={<Section id="timeline" title="Timeline">…</Section>}>
 *     <Section id="assignments" title="Assignments">…</Section>
 *   </Page>
 */
export default function Page({ title, crumbs, sub, tint, stats, sections, tabs, aside, children }) {
  return (
    <div className="page">
      <header className="title-card" style={tint ? { '--tint': tint } : undefined}>
        {crumbs && <p className="crumbs">{crumbs}</p>}
        <h1>{title}</h1>
        {sub && <div className="title-sub">{sub}</div>}
      </header>

      {stats && (
        <dl className="stats">
          {stats.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value ?? '—'}</dd>
            </div>
          ))}
        </dl>
      )}

      {tabs}
      {sections && (
        <nav className="tabbar" aria-label="Sections on this page">
          {sections.map(([id, label]) => (
            <a key={id} className="tab" href={`#${id}`} onClick={(e) => jumpTo(e, id)}>{label}</a>
          ))}
        </nav>
      )}

      {aside ? (
        <div className="page-cols">
          <div>{children}</div>
          <aside>{aside}</aside>
        </div>
      ) : children}
    </div>
  )
}

/** A titled block of a page. Give it an id to make it reachable from the section tabs. */
export function Section({ id, title, note, children }) {
  return (
    <section className="section" id={id}>
      <h2>{title}</h2>
      {note && <p className="note">{note}</p>}
      {children}
    </section>
  )
}

function jumpTo(e, id) {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
