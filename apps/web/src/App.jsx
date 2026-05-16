import { lazy, createSignal, onMount, onCleanup } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import { Landing } from './pages/Landing';
import { AuthCallback } from './pages/AuthCallback';
import { ProtectedRoute } from './lib/ProtectedRoute';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { ThemePalette } from './components/ui/ThemePalette';
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
    const [paletteOpen, setPaletteOpen] = createSignal(false);
    function handleGlobalKey(e) {
        if (e.ctrlKey && e.key === 't' && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            setPaletteOpen((v) => !v);
        }
    }
    function handleOpenEvent() {
        setPaletteOpen(true);
    }
    onMount(() => {
        window.addEventListener('keydown', handleGlobalKey);
        window.addEventListener('fermion:open-theme-palette', handleOpenEvent);
    });
    onCleanup(() => {
        window.removeEventListener('keydown', handleGlobalKey);
        window.removeEventListener('fermion:open-theme-palette', handleOpenEvent);
    });
    return (<>
      <Router>
        <Route path="/" component={Landing}/>
        <Route path="/dashboard" component={ProtectedDashboard}/>
        <Route path="/sim" component={ProtectedSim}/>
        <Route path="/auth/callback" component={AuthCallback}/>
        <Route path="/privacy" component={Privacy}/>
        <Route path="/terms" component={Terms}/>
      </Router>
      <ThemePalette open={paletteOpen()} onClose={() => setPaletteOpen(false)}/>
    </>);
}
//# sourceMappingURL=App.jsx.map