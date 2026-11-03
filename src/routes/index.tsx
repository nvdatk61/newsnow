import { createFileRoute } from "@tanstack/react-router"
import { focusSourcesAtom } from "~/atoms"
import { Column } from "~/components/column"

export const Route = createFileRoute("/")({
  component: IndexComponent,
})

function IndexComponent() {
  const focusSources = useAtomValue(focusSourcesAtom)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const id = useMemo(() => focusSources.length ? "focus" : "vietnam", [])
  return <Column id={id} />
}
