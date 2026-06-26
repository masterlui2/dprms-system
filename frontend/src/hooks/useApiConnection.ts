import { useEffect, useState } from 'react'

import { getApiConnectionMessage } from '../services/healthService'

type ApiConnectionState = {
  error: string | null
  isLoading: boolean
  message: string | null
}

export function useApiConnection(): ApiConnectionState {
  const [state, setState] = useState<ApiConnectionState>({
    error: null,
    isLoading: true,
    message: null,
  })

  useEffect(() => {
    let isMounted = true

    async function fetchApiMessage() {
      try {
        const message = await getApiConnectionMessage()

        if (isMounted) {
          setState({ error: null, isLoading: false, message })
        }
      } catch {
        if (isMounted) {
          setState({
            error: 'Unable to connect to the Laravel API.',
            isLoading: false,
            message: null,
          })
        }
      }
    }

    void fetchApiMessage()

    return () => {
      isMounted = false
    }
  }, [])

  return state
}
