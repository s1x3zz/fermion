import { Router, Route } from '@solidjs/router'
import { Landing } from './pages/Landing'
import { Scene } from './scene/Scene'

export function App() {
  return (
    <Router>
      <Route path="/" component={Landing} />
      <Route path="/sim" component={Scene} />
    </Router>
  )
}
