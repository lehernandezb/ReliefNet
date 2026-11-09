// Colour-coded pill for any status / priority value
const TONE = {
  Critical: 'red', High: 'orange', Medium: 'yellow', Low: 'gray',
  Active: 'red', Contained: 'orange', Resolved: 'green',
  Open: 'red', 'In Progress': 'orange', Cancelled: 'gray',
  Available: 'green', Deployed: 'orange', 'Off Duty': 'gray',
  Assigned: 'blue', 'En Route': 'orange', 'On Scene': 'red', Completed: 'green',
  Mandatory: 'red', Advisory: 'yellow', Cleared: 'green',
}

export default function StatusBadge({ value }) {
  return <span className={`badge ${TONE[value] || 'gray'}`}>{value}</span>
}
