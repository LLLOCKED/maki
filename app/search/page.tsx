import { Suspense } from 'react'
import SearchPageContent from './search-content'

export const dynamic = 'force-dynamic'

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Загрузка...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}
