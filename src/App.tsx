import { HashRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Topic } from './pages/Topic'
import { Demo } from './pages/Demo'
import { ThemeToggle } from './components/ui/ThemeToggle'

function App() {
  return (
    <div className="min-h-screen bg-background text-text selection:bg-accent/30">
      <ThemeToggle />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/topic/:slug" element={<Topic />} />
        </Routes>
      </main>
      <footer className="py-6 text-center text-sm text-textMuted border-t border-border mt-12">
        <p>CN Visualizer — Interactive Computer Networks Protocols</p>
      </footer>
    </div>
  )
}

export default App
