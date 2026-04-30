'use client'

import ExplicitContentDialog from './explicit-content-dialog'

interface ExplicitContentGateProps {
  novelId: string
  novelTitle: string
  isExplicit: boolean
}

export default function ExplicitContentGate({ novelId, novelTitle, isExplicit }: ExplicitContentGateProps) {
  if (!isExplicit) {
    return null
  }

  return (
    <ExplicitContentDialog novelId={novelId} novelTitle={novelTitle} />
  )
}
