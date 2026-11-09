import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'

export default function EmergencyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const isDispatcher = user.role === 'Dispatcher'
  const emergency = useApi(`/emergencies/${id}`)
  const recs = useApi(`/dispatch/recommend/${id}`)
  const resources = useApi('/resources?available=true')

  const reloadAll = () => {
    emergency.reload()
    recs.reload()
    resources.reload()
  }

  if (emergency.error) return <p className="error">{emergency.error}</p>
  if (!emergency.data) return <p>Loading…</p>
  const e = emergency.data

  return (
    <>
      <p><Link to="/dispatcher">← All emergencies</Link></p>
      <h1>
        {e.Name} <StatusBadge value={e.Priority} /> <StatusBadge value={e.Status} />
      </h1>
      <p className="muted">{e.Type} · {e.Location} · started {e.Start_Time}</p>

      <div className="grid-2">
        <section>
          <h2>Recommended teams</h2>
          {isDispatcher ? (
            <AssignTeamForm
              emergencyId={Number(id)}
              recommendations={recs.data || []}
              resources={resources.data || []}
              onDone={reloadAll}
            />
          ) : (
            <DataTable rows={recs.data} columns={[
              { key: 'Team_Name', label: 'Team' },
              { key: 'Distance_Km', label: 'km' },
              { key: 'ETA_Min', label: 'ETA (min)' },
            ]} />
          )}
        </section>

        <section>
          <h2>Status timeline</h2>
          {isDispatcher && <StatusUpdateForm emergencyId={id} onDone={emergency.reload} />}
          <ul className="timeline">
            {e.updates.map((u) => (
              <li key={u.Update_Seq}>
                <strong>#{u.Update_Seq} {u.New_Status}</strong> — {u.Notes}
                <div className="muted small">{u.Time_Stamp} · {u.Posted_By || 'system'}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <h2>Dispatch assignments</h2>
      <DataTable
        rows={e.assignments}
        empty="No teams assigned yet."
        columns={[
          { key: 'Assignment_ID', label: '#' },
          { key: 'Team_Name', label: 'Team' },
          { key: 'Priority', label: 'Priority', render: (a) => <StatusBadge value={a.Priority} /> },
          { key: 'Status', label: 'Status', render: (a) => <StatusBadge value={a.Status} /> },
          { key: 'ETA', label: 'ETA (min)' },
          { key: 'Is_Sys_Recommended', label: 'System pick', render: (a) => (a.Is_Sys_Recommended ? '✓' : '') },
          { key: 'Resources', label: 'Resources' },
          ...(isDispatcher ? [{
            key: 'actions', label: '', render: (a) => (
              <AssignmentStatusSelect assignment={a} onDone={reloadAll} />
            ),
          }] : []),
        ]}
      />

      <h2>Evacuation zones</h2>
      <DataTable
        rows={e.zones}
        columns={[
          { key: 'Zone_No', label: 'Zone' },
          { key: 'Name', label: 'Name' },
          { key: 'Status', label: 'Status', render: (z) => <StatusBadge value={z.Status} /> },
          { key: 'Est_Population', label: 'Est. population' },
        ]}
      />
    </>
  )
}

function AssignTeamForm({ emergencyId, recommendations, resources, onDone }) {
  const [teamId, setTeamId] = useState('')
  const [priority, setPriority] = useState('High')
  const [resourceIds, setResourceIds] = useState([])
  const [error, setError] = useState('')

  const top = recommendations[0]
  const chosen = recommendations.find((r) => r.Team_ID === Number(teamId))

  const toggle = (rid) =>
    setResourceIds((ids) => (ids.includes(rid) ? ids.filter((x) => x !== rid) : [...ids, rid]))

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/dispatch', {
        emergencyId,
        teamId: Number(teamId),
        priority,
        eta: chosen?.ETA_Min ?? null,
        isSysRecommended: top?.Team_ID === Number(teamId),
        resourceIds,
      })
      setTeamId('')
      setResourceIds([])
      onDone()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!recommendations.length) return <p className="muted">No available teams right now.</p>

  return (
    <form className="card" onSubmit={submit}>
      {recommendations.map((r, i) => (
        <label key={r.Team_ID} className="radio">
          <input type="radio" name="team" value={r.Team_ID} checked={teamId === String(r.Team_ID)} onChange={(e) => setTeamId(e.target.value)} />
          <span>
            <strong>{r.Team_Name}</strong> ({r.Specialty}, {r.Agency}) — {r.Distance_Km} km, ETA {r.ETA_Min} min
            {i === 0 && <span className="badge green">Recommended</span>}
          </span>
        </label>
      ))}

      <label>
        Priority
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {['Critical', 'High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
        </select>
      </label>

      <fieldset>
        <legend>Attach resources</legend>
        {resources.map((r) => (
          <label key={r.Resource_ID} className="checkbox">
            <input type="checkbox" checked={resourceIds.includes(r.Resource_ID)} onChange={() => toggle(r.Resource_ID)} />
            {r.Name} <span className="muted small">({r.Kind}, {r.Owner_Name})</span>
          </label>
        ))}
      </fieldset>

      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={!teamId}>Dispatch team</button>
    </form>
  )
}

function StatusUpdateForm({ emergencyId, onDone }) {
  const [newStatus, setNewStatus] = useState('Active')
  const [notes, setNotes] = useState('')

  async function submit(e) {
    e.preventDefault()
    await api.post(`/emergencies/${emergencyId}/updates`, { newStatus, notes })
    setNotes('')
    onDone()
  }

  return (
    <form className="card row" onSubmit={submit}>
      <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
        {['Active', 'Contained', 'Resolved'].map((s) => <option key={s}>{s}</option>)}
      </select>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What changed?" required />
      <button type="submit">Post</button>
    </form>
  )
}

function AssignmentStatusSelect({ assignment, onDone }) {
  const done = ['Completed', 'Cancelled'].includes(assignment.Status)
  return (
    <select
      value={assignment.Status}
      disabled={done}
      onChange={async (e) => {
        await api.patch(`/dispatch/${assignment.Assignment_ID}/status`, { status: e.target.value })
        onDone()
      }}
    >
      {['Assigned', 'En Route', 'On Scene', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
    </select>
  )
}
