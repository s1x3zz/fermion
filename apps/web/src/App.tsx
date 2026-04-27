import { Router, Route } from '@solidjs/router'
import { Landing } from './pages/Landing'
import { Scene } from './scene/Scene'
import { AuthCallback } from './pages/AuthCallback'
import { ProtectedRoute } from './lib/ProtectedRoute'

function ProtectedSim() {
  return (
    <ProtectedRoute>
      <Scene />
    </ProtectedRoute>
  )
}

export function App() {
  return (
    <Router>
      <Route path="/" component={Landing} />
      <Route path="/sim" component={ProtectedSim} />
      <Route path="/auth/callback" component={AuthCallback} />
    </Router>
  )
}
