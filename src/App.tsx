import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Topic } from './pages/Topic'

function App() {
  return (
    <div className="min-h-screen bg-background text-text selection:bg-primary/30">
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
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
