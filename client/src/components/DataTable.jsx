/**
 * Simple reusable table.
 *   <DataTable rows={teams} columns={[
 *     { key: 'Team_Name', label: 'Team' },
 *     { key: 'Status', label: 'Status', render: (r) => <StatusBadge value={r.Status} /> },
 *   ]} />
 */
export default function DataTable({ rows, columns, empty = 'Nothing here yet.' }) {
  if (!rows?.length) return <p className="empty">{empty}</p>

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(r) : formatValue(r[c.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatValue(v) {
  if (v === null || v === undefined) return '—'
  return String(v)
}
