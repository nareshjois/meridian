import { Link, createFileRoute } from "@tanstack/react-router"
import {
  ArrowRight,
  Compass,
  Globe2,
  HeartHandshake,
  Plane,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react"

import { ParallaxPanel } from "@/components/marketing/parallax-panel"
import { ShaderAurora } from "@/components/marketing/shader-aurora"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/")({ component: App })

const journeyCards = [
  {
    title: "Honeymoons that feel private from the first call",
    copy: "Tell us the pace, the weather, the budget, and the moments you want to remember. We shape the rest around you.",
    className: "lg:col-span-2",
    icon: HeartHandshake,
  },
  {
    title: "Family trips without the group chat chaos",
    copy: "Flights, rooms, documents, food preferences, and day plans stay coordinated for every traveler.",
    className: "",
    icon: UsersRound,
  },
  {
    title: "Visa and document guidance before it becomes urgent",
    copy: "Know what is needed, when it is needed, and what could delay the journey.",
    className: "lg:row-span-2",
    icon: ShieldCheck,
  },
  {
    title: "Flights, trains, stays, and transfers in one itinerary",
    copy: "We connect the practical pieces so the journey feels simple when it reaches you.",
    className: "lg:col-span-2",
    icon: Plane,
  },
  {
    title: "Groups that move together",
    copy: "Pilgrimages, school tours, destination weddings, corporate offsites, and custom departures planned with one steady point of contact.",
    className: "",
    icon: Globe2,
  },
]

const itineraryMoments = [
  {
    eyebrow: "First conversation",
    title: "We start with the trip you actually want.",
    copy: "Dates and destinations matter, but so do energy, comfort, food, family needs, and the kind of memories you want to bring home.",
  },
  {
    eyebrow: "Thoughtful planning",
    title: "Every route, stay, and stop has a reason.",
    copy: "Your itinerary is shaped around timing, distance, budget, visa needs, and the small details that make travel feel considered.",
  },
  {
    eyebrow: "Before you leave",
    title: "You depart with fewer open loops.",
    copy: "Documents, confirmations, traveler details, vendor contacts, and day-by-day plans are gathered before the airport rush begins.",
  },
]

function App() {
  return (
    <main className="min-h-svh overflow-hidden bg-[#031111] text-white">
      <section className="relative isolate min-h-svh">
        <ShaderAurora className="absolute inset-0" intensity="vivid" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(3,17,17,0.16),rgba(3,17,17,0.88)_78%,#031111)]" />
        <div className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-full text-sm font-semibold tracking-tight text-white outline-none focus-visible:ring-3 focus-visible:ring-teal-200/70"
              aria-label="Meridian home"
            >
              <span className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-2xl shadow-teal-950/40 backdrop-blur">
                <Compass className="size-4 text-teal-100" aria-hidden="true" />
              </span>
              Meridian
            </Link>
            <nav
              aria-label="Primary navigation"
              className="flex items-center gap-3"
            >
              <Link
                to="/auth/login"
                className="rounded-full px-3 py-2 text-sm font-medium text-teal-50/85 transition outline-none hover:text-white focus-visible:ring-3 focus-visible:ring-teal-200/70"
              >
                Log in
              </Link>
              <a
                href="mailto:hello@meridian.example?subject=Plan%20my%20trip%20with%20Meridian"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-full bg-white px-4 text-[#06201c] shadow-xl shadow-teal-950/30 hover:bg-teal-50"
                )}
              >
                Plan a trip
              </a>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-14 py-20 md:gap-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-14">
            <div className="max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-teal-50/90 shadow-2xl shadow-teal-950/30 backdrop-blur-md">
                <Sparkles
                  className="size-3.5 text-teal-200"
                  aria-hidden="true"
                />
                Tailor-made journeys for families, couples, and groups
              </div>
              <h1 className="max-w-5xl font-heading text-5xl leading-[0.92] font-semibold tracking-[-0.06em] text-balance sm:text-7xl lg:text-8xl">
                Travel plans that feel personal before you even pack.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-teal-50/80 sm:text-xl">
                Meridian helps you plan flights, stays, visas, transfers, and
                once-in-a-while experiences with a travel team that keeps the
                whole journey in view.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="mailto:hello@meridian.example?subject=Plan%20my%20journey%20with%20Meridian"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 rounded-full bg-teal-200 px-6 text-base text-[#05221d] shadow-2xl shadow-teal-950/40 hover:bg-teal-100"
                  )}
                >
                  Plan my journey
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <a
                  href="#story"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 text-base font-medium text-white backdrop-blur transition hover:bg-white/15 focus-visible:ring-3 focus-visible:ring-teal-200/70 focus-visible:outline-none"
                >
                  Explore trips
                </a>
              </div>
            </div>

            <ParallaxPanel
              speed={0.08}
              className="relative mx-auto w-full max-w-xl lg:mr-0"
            >
              <div className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-4 shadow-2xl shadow-black/35 backdrop-blur-2xl">
                <div className="rounded-[1.5rem] border border-white/10 bg-[#061c1a]/90 p-5">
                  <div className="mb-5 flex items-center justify-between text-xs tracking-[0.28em] text-teal-100/60 uppercase">
                    <span>Sample itinerary</span>
                    <span>7 days</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      "Delhi to Singapore",
                      "Sentosa family stay",
                      "Visa notes ready",
                    ].map((item, index) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-200 text-xs font-semibold text-[#05221d]">
                            {index + 1}
                          </span>
                          <div>
                            <h2 className="font-heading text-lg font-medium text-white">
                              {item}
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-teal-50/68">
                              Flights, hotel nights, transfers, documents, and
                              day plans arranged around the travelers.
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ParallaxPanel>
          </div>
        </div>
      </section>

      <section
        id="story"
        className="relative border-y border-white/10 bg-[#f7fbf7] py-24 text-[#08201d] sm:py-32"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.72),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <ParallaxPanel speed={0.1} className="lg:sticky lg:top-24 lg:h-fit">
            <p className="text-sm font-semibold tracking-[0.28em] text-teal-700 uppercase">
              Journeys we shape
            </p>
            <h2 className="mt-5 max-w-4xl font-heading text-4xl leading-none font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
              The right trip is built around people, not packages.
            </h2>
          </ParallaxPanel>

          <div className="mt-12 grid auto-rows-[minmax(18rem,auto)] gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {journeyCards.map((card) => {
              const Icon = card.icon

              return (
                <article
                  key={card.title}
                  className={cn(
                    "rounded-[2rem] border border-teal-950/10 bg-white/82 p-6 shadow-xl shadow-teal-950/5 backdrop-blur sm:p-8",
                    card.className
                  )}
                >
                  <div className="flex h-full min-h-64 flex-col justify-between gap-8">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-800">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-heading text-2xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-3xl">
                        {card.title}
                      </h3>
                      <p className="mt-4 max-w-xl text-base leading-8 text-[#31514b]">
                        {card.copy}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative bg-[#031111] px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-start gap-12 md:gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold tracking-[0.28em] text-teal-200/70 uppercase">
              How planning feels
            </p>
            <h2 className="mt-5 font-heading text-4xl leading-none font-semibold tracking-[-0.05em] text-balance text-white sm:text-6xl">
              Calm planning before the beautiful part begins.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-teal-50/72">
              A good trip is more than a booking. It is timing, paperwork,
              comfort, local movement, and the confidence that someone has
              checked the path before you take it.
            </p>
          </div>

          <div className="grid gap-5">
            {itineraryMoments.map((section) => (
              <article
                key={section.title}
                className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-xl shadow-black/10 backdrop-blur sm:p-8"
              >
                <p className="text-sm font-semibold tracking-[0.24em] text-teal-200/70 uppercase">
                  {section.eyebrow}
                </p>
                <h3 className="mt-5 font-heading text-3xl leading-tight font-semibold tracking-[-0.035em] text-balance text-white">
                  {section.title}
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-8 text-teal-50/72">
                  {section.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-[#f7fbf7] px-5 py-24 text-[#08201d] sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold tracking-[0.28em] text-teal-700 uppercase">
            Start with a conversation
          </p>
          <h2 className="mt-5 font-heading text-4xl leading-none font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
            Tell us where you want to go. We will help with the way there.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#31514b]">
            Bring the dream, the constraints, or just a rough month on the
            calendar. Meridian can turn it into a journey that feels considered
            from the first mile.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="mailto:hello@meridian.example?subject=Plan%20my%20trip%20with%20Meridian"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-full bg-[#06201c] px-6 text-base text-white hover:bg-[#0a312a]"
              )}
            >
              Plan my trip
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <Link
              to="/auth/login"
              className="inline-flex h-12 items-center justify-center rounded-full px-6 text-base font-medium text-teal-800 underline-offset-4 transition hover:underline focus-visible:ring-3 focus-visible:ring-teal-600/30 focus-visible:outline-none"
            >
              Staff login
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
