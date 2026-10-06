export const LIBRARY_TABS = [
  { id: "proof", label: "Proof" },
  { id: "audience", label: "Audience" },
  { id: "pipeline", label: "Pipeline" },
  { id: "templates", label: "Templates" },
  { id: "swipe", label: "Swipe file" },
  { id: "posts", label: "My posts" },
  { id: "three", label: "One idea, three posts" },
] as const

export type LibraryTab = (typeof LIBRARY_TABS)[number]["id"]
