import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import Page, { Section } from '../../components/Page'
import StatusBadge from '../../components/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { formatDateTime } from '../../utils/format'

export default function DispatcherDashboard() {
  const emergencies = useApi('/emergencies')
  const requests = useApi('/help-requests?status=Open')

  async function setRequestStatus(id, status) {
    await api.patch(`/help-requests/${id}/status`, { status })
    requests.reload()
    emergencies.reload()
  }

  const list = emergencies.data
  const sum = (key) => list?.reduce((n, e) => n + Number(e[key] || 0), 0)

  return (
    <Page
      title="Emergencies"
      tint="#a3242b"
      sub="Everything that is active or contained right now, most urgent first."
      stats={[
        ['Active emergencies', list?.length],
        ['Critical priority', list?.filter((e) => e.Priority === 'Critical').length],
        ['Open help requests', requests.data?.length],
        ['Team assignments', sum('Assignments')],
      ]}
      sections={[
        ['emergencies', 'Active emergencies'],
        ['requests', 'Open help requests'],
      ]}
    >
      <Section id="emergencies" title="Active emergencies">
        <DataTable
          rows={list}
          empty="No active emergencies."
          columns={[
            { key: 'Name', label: 'Emergency', render: (e) => <Link to={`/dispatcher/emergencies/${e.Emergency_ID}`}>{e.Name}</Link> },
            { key: 'Type', label: 'Type' },
            { key: 'Location', label: 'Location' },
            { key: 'Priority', label: 'Priority', render: (e) => <StatusBadge value={e.Priority} /> },
            { key: 'Status', label: 'Status', render: (e) => <StatusBadge value={e.Status} /> },
            { key: 'Start_Time', label: 'Started', render: (e) => formatDateTime(e.Start_Time) },
            { key: 'Open_Requests', label: 'Open requests' },
            { key: 'Assignments', label: 'Teams' },
          ]}
        />
      </Section>

      <Section id="requests" title="Open help requests" note="Accept a request to mark it in progress, or resolve it once it has been handled.">
        <DataTable
          rows={requests.data}
          empty="No open requests."
          columns={[
            { key: 'Request_ID', label: '#' },
            { key: 'Type', label: 'Type', render: (r) => <span className="primary">{r.Type}</span> },
            { key: 'Emergency_Name', label: 'Emergency' },
            { key: 'Description', label: 'Details' },
            { key: 'Location', label: 'Location' },
            { key: 'Submitted_By', label: 'From' },
            {
              key: 'actions', label: '', render: (r) => (
                <span className="actions">
                  <button className="small" onClick={() => setRequestStatus(r.Request_ID, 'In Progress')}>Accept</button>
                  <button className="small secondary" onClick={() => setRequestStatus(r.Request_ID, 'Resolved')}>Resolve</button>
                </span>
              ),
            },
          ]}
        />
      </Section>
    </Page>
  )
}
