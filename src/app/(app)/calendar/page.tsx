import { CalendarView } from "@/components/calendar/calendar-view"

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const { view, at } = await searchParams
  return <CalendarView view={view === "week" ? "week" : view === "month" ? "month" : null} at={typeof at === "string" ? at : null} />
}
