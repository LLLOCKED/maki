import Link from 'next/link'
import { Search } from 'lucide-react'

export default function SearchButton() {
  return (
    <Link
      href="/search"
      className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
    >
      <Search className="h-4 w-4" />
      Пошук
    </Link>
  )
}
