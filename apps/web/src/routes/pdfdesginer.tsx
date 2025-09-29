import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pdfdesginer')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/pdfdesginer"!</div>
}
