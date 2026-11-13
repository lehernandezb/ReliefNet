import { useState } from 'react'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import Page from '../../components/Page'
import StatusBadge from '../../components/StatusBadge'
import { useApi } from '../../hooks/useApi'

const TABS = ['Agencies', 'Teams', 'Resources', 'Facilities']

export default function AdminDashboard() {
  const [tab, setTab] = useState('Agencies')

  return (
    <Page
      title="Administration"
      tint="#3d5fc4"
      sub="Agencies, response teams, resources and facilities registered in ReliefNet."
      tabs={
        <div className="tabbar" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={t === tab} className="tab" onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      }
    >
      <h2 className="sr-only">{tab}</h2>
      {tab === 'Agencies' && <AgenciesTab />}
      {tab === 'Teams' && <TeamsTab />}
      {tab === 'Resources' && <ResourcesTab />}
      {tab === 'Facilities' && <FacilitiesTab />}
    </Page>
  )
}

function AgenciesTab() {
  const agencies = useApi('/agencies')
  const [name, setName] = useState('')
  const [type, setType] = useState('')

  async function add(e) {
    e.preventDefault()
    await api.post('/agencies', { name, type })
    setName('')
    setType('')
    agencies.reload()
  }

  return (
    <>
      <form className="card row" onSubmit={add} aria-label="Add an agency">
        <input placeholder="Agency name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Type (Fire, EMS…)" value={type} onChange={(e) => setType(e.target.value)} />
        <button type="submit">Add agency</button>
      </form>
      <DataTable rows={agencies.data} columns={[
        { key: 'Agency_ID', label: 'ID' },
        { key: 'Name', label: 'Name', render: (a) => <span className="primary">{a.Name}</span> },
        { key: 'Type', label: 'Type' },
        { key: 'Contact', label: 'Contact' },
        { key: 'Responders', label: 'Responders' },
        { key: 'Teams', label: 'Teams' },
        { key: 'Resources', label: 'Resources' },
      ]} />
    </>
  )
}

function TeamsTab() {
  const teams = useApi('/teams')
  // TODO: create team / manage members form
  return (
    <DataTable rows={teams.data} columns={[
      { key: 'Team_Name', label: 'Team', render: (t) => <span className="primary">{t.Team_Name}</span> },
      { key: 'Specialty', label: 'Specialty' },
      { key: 'Agency_Name', label: 'Agency' },
      { key: 'Leader_Name', label: 'Leader' },
      { key: 'Member_Count', label: 'Members' },
      { key: 'Status', label: 'Status', render: (t) => <StatusBadge value={t.Status} /> },
      { key: 'Location', label: 'Location' },
    ]} />
  )
}

function ResourcesTab() {
  const resources = useApi('/resources')
  // TODO: create-resource form (POST /resources with kind Vehicle | Equipment)
  return (
    <DataTable rows={resources.data} columns={[
      { key: 'Name', label: 'Resource', render: (r) => <span className="primary">{r.Name}</span> },
      { key: 'Kind', label: 'Kind' },
      { key: 'detail', label: 'Details', render: (r) => r.Kind === 'Vehicle'
        ? `${r.Vehicle_Type}, plate ${r.Plate_Number}, fuel ${r.Fuel_Level}%`
        : `${r.Equipment_Type} × ${r.Quantity}${r.Is_Medical ? ', medical' : ''}` },
      { key: 'Owner_Name', label: 'Owner' },
      { key: 'In_Use', label: 'In use', render: (r) => (r.In_Use ? 'Yes' : 'No') },
    ]} />
  )
}

function FacilitiesTab() {
  const facilities = useApi('/facilities')

  async function adjust(id, delta) {
    try {
      await api.patch(`/facilities/${id}/occupancy`, { delta })
      facilities.reload()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <DataTable rows={facilities.data} columns={[
      { key: 'Name', label: 'Facility', render: (f) => <span className="primary">{f.Name}</span> },
      { key: 'Kind', label: 'Kind' },
      { key: 'occ', label: 'Occupancy', render: (f) => (
        <span className="meter">
          <span className="meter-track">
            <span
              className={`meter-fill${f.Spaces_Left <= 0 ? ' full' : ''}`}
              style={{ width: `${Math.min(100, (f.Current_Occupancy / f.Max_Capacity) * 100)}%` }}
            />
          </span>
          <span className="num">{f.Current_Occupancy} / {f.Max_Capacity}</span>
        </span>
      ) },
      { key: 'Spaces_Left', label: 'Spaces left' },
      { key: 'actions', label: '', render: (f) => (
        <span className="actions">
          <button className="small secondary" aria-label={`Remove one person from ${f.Name}`} onClick={() => adjust(f.Facility_ID, -1)}>−1</button>
          <button className="small secondary" aria-label={`Add one person to ${f.Name}`} onClick={() => adjust(f.Facility_ID, 1)}>+1</button>
        </span>
      ) },
    ]} />
  )
}
