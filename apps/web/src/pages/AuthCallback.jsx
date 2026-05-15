import { onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';
export function AuthCallback() {
    const navigate = useNavigate();
    onMount(async () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            // PKCE flow: exchange authorization code for session
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
                navigate(`/?login=1&error=${encodeURIComponent(error.message)}`, { replace: true });
            }
            else {
                navigate('/sim', { replace: true });
            }
        }
        else {
            // Implicit / hash flow — Supabase auto-detects from URL fragment
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                navigate('/sim', { replace: true });
            }
            else {
                navigate('/?login=1', { replace: true });
            }
        }
    });
    // Blank dark screen while redirecting
    return (<div style={{ width: '100vw', height: '100vh', background: '#0a0a0f' }}/>);
}
//# sourceMappingURL=AuthCallback.jsx.map