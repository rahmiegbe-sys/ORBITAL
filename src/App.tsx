import SimCanvas from './SimCanvas'
import './App.css'

export default function App() {
  return (
    <main className="page">
      <SimCanvas />
      <p className="footnote">
        Newtonian gravity · Velocity Verlet integration · units: AU, solar masses, G = 1 (2π time units = 1 year)
      </p>
    </main>
  )
}
