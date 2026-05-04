import { Card, CardContent } from '@/components/ui/card'

export default function TeamLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
        <div className="space-y-3">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
              <div className="space-y-2">
                <div className="h-6 w-12 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-3">
          <div className="h-7 w-32 animate-pulse rounded bg-muted" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
        <div className="space-y-3 md:col-span-2">
          <div className="h-7 w-40 animate-pulse rounded bg-muted" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      </div>
    </div>
  )
}
