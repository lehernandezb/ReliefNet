import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import Page, { Section } from '../../components/Page'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, PRIORITY_TINT } from '../../utils/format'

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

  if (emergency.error) return <div className="page"><p className="error">{emergency.error}</p></div>
  if (!emergency.data) return <div className="page"><p className="muted">Loading…</p></div>
  const e = emergency.data
  // Highlight whichever update has the highest sequence number
  const latestIndex = e.updates.reduce((best, u, i, all) => (u.Update_Seq > all[best].Update_Seq ? i : best), 0)

  const zonePopulation = e.zones.reduce((n, z) => n + Number(z.Est_Population || 0), 0)

  return (
    <Page
      title={e.Name}
      tint={PRIORITY_TINT[e.Priority]}
      crumbs={<><Link to="/dispatcher">Emergencies</Link> / {e.Name}</>}
      sub={
        <>
          <StatusBadge value={e.Priority} />
          <StatusBadge value={e.Status} />
          <span>{e.Type} at {e.Location}</span>
        </>
      }
      stats={[
        ['Started', formatDateTime(e.Start_Time)],
        ['Teams assigned', e.assignments.length],
        ['Evacuation zones', e.zones.length],
        ['People in zones', zonePopulation.toLocaleString()],
        ['Status updates', e.updates.length],
      ]}
      sections={[
        ['teams', isDispatcher ? 'Dispatch a team' : 'Recommended teams'],
        ['assignments', 'Assignments'],
        ['zones', 'Evacuation zones'],
        ['timeline', 'Timeline'],
      ]}
      aside={
        <Section id="timeline" title="Status timeline">
          {isDispatcher && <StatusUpdateForm emergencyId={id} onDone={emergency.reload} />}
          <ul className="timeline">
            {e.updates.map((u, i) => (
              <li key={u.Update_Seq} className={i === latestIndex ? 'latest' : undefined}>
                <strong>{u.New_Status}</strong>
                {u.Notes && <div>{u.Notes}</div>}
                <div className="muted small">{formatDateTime(u.Time_Stamp)}, {u.Posted_By || 'system'}</div>
              </li>
            ))}
          </ul>
        </Section>
      }
    >
      <Section
        id="teams"
        title={isDispatcher ? 'Dispatch a team' : 'Recommended teams'}
        note="Available teams, closest first. The first one is the system recommendation."
      >
        {isDispatcher ? (
          <AssignTeamForm
            emergencyId={Number(id)}
            recommendations={recs.data || []}
            resources={resources.data || []}
            onDone={reloadAll}
          />
        ) : (
          <DataTable rows={recs.data} columns={[
            { key: 'Team_Name', label: 'Team', render: (r) => <span className="primary">{r.Team_Name}</span> },
            { key: 'Specialty', label: 'Specialty' },
            { key: 'Distance_Km', label: 'Distance (km)' },
            { key: 'ETA_Min', label: 'ETA (min)' },
          ]} />
        )}
      </Section>

      <Section id="assignments" title="Dispatch assignments">
        <DataTable
          rows={e.assignments}
          empty="No teams assigned yet."
          columns={[
            { key: 'Assignment_ID', label: '#' },
            { key: 'Team_Name', label: 'Team', render: (a) => <span className="primary">{a.Team_Name}</span> },
            { key: 'Priority', label: 'Priority', render: (a) => <StatusBadge value={a.Priority} /> },
            { key: 'Status', label: 'Status', render: (a) => <StatusBadge value={a.Status} /> },
            { key: 'ETA', label: 'ETA (min)' },
            { key: 'Is_Sys_Recommended', label: 'System pick', render: (a) => (a.Is_Sys_Recommended ? 'Yes' : 'No') },
            { key: 'Resources', label: 'Resources' },
            ...(isDispatcher ? [{
              key: 'actions', label: 'Update', render: (a) => (
                <AssignmentStatusSelect assignment={a} onDone={reloadAll} />
              ),
            }] : []),
          ]}
        />
      </Section>

      <Section id="zones" title="Evacuation zones">
        <DataTable
          rows={e.zones}
          empty="No evacuation zones for this emergency."
          columns={[
            { key: 'Zone_No', label: 'Zone' },
            { key: 'Name', label: 'Name', render: (z) => <span className="primary">{z.Name}</span> },
            { key: 'Status', label: 'Status', render: (z) => <StatusBadge value={z.Status} /> },
            { key: 'Est_Population', label: 'Est. population', render: (z) => Number(z.Est_Population || 0).toLocaleString() },
          ]}
        />
      </Section>
    </Page>
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
      <fieldset>
        <legend>Team</legend>
        <div className="options">
          {recommendations.map((r, i) => (
            <label key={r.Team_ID} className="option">
              <input type="radio" name="team" value={r.Team_ID} checked={teamId === String(r.Team_ID)} onChange={(e) => setTeamId(e.target.value)} />
              <span className="grow">
                <strong>{r.Team_Name}</strong> <span className="muted">{r.Specialty}, {r.Agency}</span>
              </span>
              {i === 0 && <span className="badge green">Recommended</span>}
              <span className="figure">{r.Distance_Km} km, {r.ETA_Min} min</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Attach resources</legend>
        {resources.length ? (
          <div className="options">
            {resources.map((r) => (
              <label key={r.Resource_ID} className="option">
                <input type="checkbox" checked={resourceIds.includes(r.Resource_ID)} onChange={() => toggle(r.Resource_ID)} />
                <span className="grow">{r.Name}</span>
                <span className="figure">{r.Kind}, {r.Owner_Name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="muted small">No resources are free right now.</p>
        )}
      </fieldset>

      <label>
        Priority
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {['Critical', 'High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
        </select>
      </label>

      {error && <p className="error">{error}</p>}
      <div><button type="submit" disabled={!teamId}>Dispatch team</button></div>
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
