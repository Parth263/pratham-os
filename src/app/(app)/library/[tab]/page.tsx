import { notFound } from "next/navigation"
import { LibraryView } from "@/components/library/library-view"
import { LIBRARY_TABS, type LibraryTab } from "@/lib/library-tabs"

export default async function LibraryPage({ params, searchParams }: PageProps<"/library/[tab]">) {
  const { tab } = await params
  const { filter } = await searchParams
  if (!LIBRARY_TABS.some((t) => t.id === tab)) notFound()
  return <LibraryView tab={tab as LibraryTab} filter={typeof filter === "string" ? filter : null} />
}
