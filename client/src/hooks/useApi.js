import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

/**
 * Load data from a GET endpoint.
 *   const { data, error, loading, reload } = useApi('/emergencies')
 * Call reload() after a POST/PATCH to refresh.
 */
export function useApi(path) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    if (!path) return
    setLoading(true)
    api.get(path)
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [path])

  useEffect(reload, [reload])

  return { data, error, loading, reload }
}
