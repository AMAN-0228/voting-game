'use client'

import React from 'react'

// Stable layout component that doesn't re-render on route changes
const StableLayout = React.memo(({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
})

StableLayout.displayName = 'StableLayout'

export default StableLayout
