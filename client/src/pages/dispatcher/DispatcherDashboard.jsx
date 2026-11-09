import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import { useApi } from '../../hooks/useApi'

export default function DispatcherDashboard() {
  const emergencies = useApi('/emergencies')
  const requests = useApi('/help-requests?status=Open')

  async function setRequestStatus(id, status) {
    await api.patch(`/help-requests/${id}/status`, { status })
    requests.reload()
    emergencies.reload()
  }

  return (
    <>
      <h1>Active emergencies</h1>
      <DataTable
        rows={emergencies.data}
        columns={[
          { key: 'Name', label: 'Emergency', render: (e) => <Link to={`/dispatcher/emergencies/${e.Emergency_ID}`}>{e.Name}</Link> },
          { key: 'Type', label: 'Type' },
          { key: 'Priority', label: 'Priority', render: (e) => <StatusBadge value={e.Priority} /> },
          { key: 'Status', label: 'Status', render: (e) => <StatusBadge value={e.Status} /> },
          { key: 'Open_Requests', label: 'Open requests' },
          { key: 'Assignments', label: 'Assignments' },
        ]}
      />

      <h2>Open help requests</h2>
      <DataTable
        rows={requests.data}
        empty="No open requests."
        columns={[
          { key: 'Request_ID', label: '#' },
          { key: 'Emergency_Name', label: 'Emergency' },
          { key: 'Type', label: 'Type' },
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
    </>
  )
}
