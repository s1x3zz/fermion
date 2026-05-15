import { Show, createEffect } from 'solid-js';
import { Navigate, useSearchParams } from '@solidjs/router';
import { useAuthStore } from '../stores/authStore';
function LoadingScreen() {
    return (<div style={{
            width: '100vw',
            height: '100vh',
            background: '#0a0a0f',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
        }}>
      <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #1a1a2e',
            'border-top-color': '#3b8bff',
            'border-radius': '50%',
            animation: 'spin 0.7s linear infinite',
        }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>);
}
export function ProtectedRoute(props) {
    const auth = useAuthStore();
    const [searchParams] = useSearchParams();
    // Sync guest flag into the store reactively
    createEffect(() => {
        auth.setGuest(searchParams.guest === 'true');
    });
    const isAllowed = () => auth.session() !== null || searchParams.guest === 'true';
    return (<Show when={!auth.loading()} fallback={<LoadingScreen />}>
      <Show when={isAllowed()} fallback={<Navigate href="/?login=1"/>}>
        {props.children}
      </Show>
    </Show>);
}
//# sourceMappingURL=ProtectedRoute.jsx.map