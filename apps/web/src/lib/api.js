import { supabase } from './supabase';
const BASE_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001';
async function authFetch(path, options = {}) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
}
export const api = {
    async getProfile() {
        const res = await authFetch('/api/auth/profile');
        if (!res.ok)
            throw new Error('Failed to fetch profile');
        return res.json();
    },
    async getProjects() {
        const res = await authFetch('/api/projects');
        if (!res.ok)
            throw new Error('Failed to fetch projects');
        return res.json();
    },
    async saveProject(project) {
        if (project.id) {
            const res = await authFetch(`/api/projects/${project.id}`, {
                method: 'PUT',
                body: JSON.stringify({ circuit: project.circuit, metadata: project.metadata }),
            });
            if (!res.ok)
                throw new Error('Failed to save project');
        }
        else {
            const res = await authFetch('/api/projects', {
                method: 'POST',
                body: JSON.stringify(project),
            });
            if (!res.ok) {
                const err = (await res.json());
                throw Object.assign(new Error(err.error), err);
            }
        }
    },
    async deleteProject(id) {
        const res = await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
        if (!res.ok)
            throw new Error('Failed to delete project');
    },
    async createCheckout(tier) {
        const res = await authFetch('/api/billing/create-checkout', {
            method: 'POST',
            body: JSON.stringify({ tier }),
        });
        if (!res.ok)
            throw new Error('Failed to create checkout');
        return res.json();
    },
    async createPortal() {
        const res = await authFetch('/api/billing/create-portal', {
            method: 'POST',
            body: '{}',
        });
        if (!res.ok)
            throw new Error('Failed to create portal');
        return res.json();
    },
};
//# sourceMappingURL=api.js.map