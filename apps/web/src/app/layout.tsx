import './globals.css'
import type { Metadata } from 'next'
import { fontHeading, fontData } from '../lib/fonts'
import { ConnectionBanner } from '@/features/system/ConnectionBanner'
import { ConditionalHud, ConditionalNav } from '@/features/onboarding/components/AppChrome'
import { OnboardingGate } from '@/features/onboarding/components/OnboardingGate'
import { TourDirector } from '@/features/onboarding/components/TourDirector'
import { AppShell } from '@/components/AppShell'
import { Toast } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'Neon Cipher',
  description: 'Mobile-first hacking game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fontHeading.variable} ${fontData.variable}`}>
      <body className="bg-panel text-ink overflow-hidden w-full h-[100dvh] min-h-[100dvh] max-h-[100dvh] fixed inset-0 font-data text-[14px]">
        <AppShell>
          <div className="app-workspace mx-auto w-full h-[100dvh] min-h-[100dvh] max-h-[100dvh] bg-panel text-ink flex flex-col relative sm:border-x sm:border-line overflow-hidden">
            <a href="#game-content" className="skip-link">Skip to game content</a>
            {/* Network & Mid-duel status banner */}
            <ConnectionBanner />

            {/* Top HUD Slot (rendered only when chromeVisible is true) */}
            <ConditionalHud />

            {/* Main Content Area */}
            <main id="game-content" tabIndex={-1} className="flex-1 min-h-0 min-w-0 overflow-hidden relative z-0 flex flex-col outline-none">
              {children}
            </main>

            {/* Global Feedback Toast */}
            <Toast />

            {/* Bottom Nav (rendered only when chromeVisible is true) */}
            <ConditionalNav />

            {/* Onboarding Gate Route Guard */}
            <OnboardingGate />

            {/* Guided Tour Director */}
            <TourDirector />
          </div>
        </AppShell>
      </body>
    </html>
  )
}
