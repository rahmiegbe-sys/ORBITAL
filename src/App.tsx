import SimCanvas from './SimCanvas'
import './App.css'

export default function App() {
  return (
    <main className="page">
      <nav className="topbar" aria-label="Site">
        <a className="story-link" href="/story.html">
          The story behind ORBITAL
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </nav>
      <SimCanvas />
      <p className="footnote">
        Newtonian gravity · Velocity Verlet integration · units: AU, solar masses, G = 1 (2π time units = 1 year)
      </p>
    </main>
  )
}
