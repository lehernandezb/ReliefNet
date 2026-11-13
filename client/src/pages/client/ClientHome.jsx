import { useState } from 'react'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import Page, { Section } from '../../components/Page'
import StatusBadge from '../../components/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { formatDateTime } from '../../utils/format'

const REQUEST_TYPES = ['Evacuation', 'Medical', 'Shelter', 'Supplies', 'Rescue', 'Other']

export default function ClientHome() {
  const emergencies = useApi('/emergencies')
  const requests = useApi('/help-requests')
  const shelters = useApi('/facilities')
  const [form, setForm] = useState({ emergencyId: '', type: 'Evacuation', location: '', description: '' })
  const [msg, setMsg] = useState('')

  const openShelters = shelters.data?.filter((f) => f.Kind === 'Shelter' && f.Spaces_Left > 0)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    try {
      await api.post('/help-requests', { ...form, emergencyId: Number(form.emergencyId) })
      setForm({ ...form, location: '', description: '' })
      setMsg('Request sent. A dispatcher will review it shortly.')
      requests.reload()
    } catch (err) {
      setMsg(err.message)
    }
  }

  return (
    <Page
      title="Request help"
      tint="#3d7ea6"
      sub="Tell us what you need. A dispatcher reviews every request."
      stats={[
        ['Requests sent', requests.data?.length],
        ['Still open', requests.data?.filter((r) => r.Status === 'Open' || r.Status === 'In Progress').length],
        ['Shelters with space', openShelters?.length],
      ]}
      sections={[
        ['new', 'New request'],
        ['mine', 'My requests'],
        ['shelters', 'Shelters with space'],
      ]}
    >
      <Section id="new" title="New request">
      <form className="card" onSubmit={submit}>
        <div className="row">
          <label>
            Emergency
            <select value={form.emergencyId} onChange={set('emergencyId')} required>
              <option value="">Select…</option>
              {emergencies.data?.map((e) => (
                <option key={e.Emergency_ID} value={e.Emergency_ID}>{e.Name}</option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select value={form.type} onChange={set('type')}>
              {REQUEST_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <label>Your location<input value={form.location} onChange={set('location')} placeholder="Address or landmark" /></label>
        <label>What do you need?<textarea rows={3} value={form.description} onChange={set('description')} /></label>
        {msg && <p className="muted">{msg}</p>}
        <div><button type="submit">Send request</button></div>
      </form>
      </Section>

      <Section id="mine" title="My requests">
      <DataTable
        rows={requests.data}
        empty="You haven't sent any requests yet."
        columns={[
          { key: 'Request_ID', label: '#' },
          { key: 'Emergency_Name', label: 'Emergency', render: (r) => <span className="primary">{r.Emergency_Name}</span> },
          { key: 'Type', label: 'Type' },
          { key: 'Status', label: 'Status', render: (r) => <StatusBadge value={r.Status} /> },
          { key: 'Submitted_Date', label: 'Sent', render: (r) => formatDateTime(r.Submitted_Date) },
        ]}
      />

      </Section>

      <Section id="shelters" title="Shelters with space">
      <DataTable
        rows={openShelters}
        empty="No shelters have space right now."
        columns={[
          { key: 'Name', label: 'Shelter', render: (r) => <span className="primary">{r.Name}</span> },
          { key: 'Address', label: 'Address' },
          { key: 'Spaces_Left', label: 'Spaces left' },
          { key: 'Pet_Friendly', label: 'Pets', render: (r) => (r.Pet_Friendly ? 'Yes' : 'No') },
          { key: 'Is_Accessible', label: 'Accessible', render: (r) => (r.Is_Accessible ? 'Yes' : 'No') },
        ]}
      />
      </Section>
    </Page>
  )
}
