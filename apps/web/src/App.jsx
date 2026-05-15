import { lazy } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import { Landing } from './pages/Landing';
import { AuthCallback } from './pages/AuthCallback';
import { ProtectedRoute } from './lib/ProtectedRoute';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Simulator = lazy(() => import('./pages/Simulator'));
function ProtectedSim() {
    return (<ProtectedRoute>
      <Simulator />
    </ProtectedRoute>);
}
function ProtectedDashboard() {
    return (<ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>);
}
export function App() {
    return (<Router>
      <Route path="/" component={Landing}/>
      <Route path="/dashboard" component={ProtectedDashboard}/>
      <Route path="/sim" component={ProtectedSim}/>
      <Route path="/auth/callback" component={AuthCallback}/>
    </Router>);
}
//# sourceMappingURL=App.jsx.map