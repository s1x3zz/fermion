import { createSignal, Show, For, onMount } from 'solid-js';
import { Portal } from 'solid-js/web';
import { useNavigate, A } from '@solidjs/router';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore, ProjectLimitError } from '../stores/projectStore';
import { openThemePalette } from '../stores/themeStore';
import { PROJECT_LIMITS } from '@fermion/core';
import './dashboard.css';
// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(ts) {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(ts));
}
function getUserTierLabel(user) {
    const u = user();
    if (!u)
        return 'guest';
    return u.user_metadata?.tier ?? 'free';
}
// ── New Project Modal ─────────────────────────────────────────────────────────
function NewProjectModal(props) {
    const [name, setName] = createSignal('');
    const [description, setDescription] = createSignal('');
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal('');
    async function handleSubmit(e) {
        e.preventDefault();
        if (!name().trim())
            return;
        setLoading(true);
        setError('');
        try {
            await props.onCreate(name().trim(), description().trim() || undefined);
            props.onClose();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create project');
        }
        finally {
            setLoading(false);
        }
    }
    function handleKeyDown(e) {
        if (e.key === 'Escape')
            props.onClose();
    }
    onMount(() => window.addEventListener('keydown', handleKeyDown));
    return (<Portal>
      <div class="modal-backdrop" onClick={(e) => e.target === e.currentTarget && props.onClose()}>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
          <h2 id="new-project-title">New Project</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', 'flex-direction': 'column', gap: '0.75rem' }}>
            <input class="modal-input" type="text" placeholder="Project name" value={name()} onInput={(e) => setName(e.currentTarget.value)} maxLength={100} autofocus required/>
            <input class="modal-input" type="text" placeholder="Description (optional)" value={description()} onInput={(e) => setDescription(e.currentTarget.value)} maxLength={500}/>
            <Show when={error()}>
              <p style={{ color: '#f87171', 'font-size': '0.8rem', margin: 0 }}>{error()}</p>
            </Show>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" onClick={props.onClose}>Cancel</button>
              <button type="submit" class="btn btn-primary" disabled={loading() || !name().trim()}>
                {loading() ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>);
}
// ── Limit Modal ───────────────────────────────────────────────────────────────
function LimitModal(props) {
    function handleKeyDown(e) {
        if (e.key === 'Escape')
            props.onClose();
    }
    onMount(() => window.addEventListener('keydown', handleKeyDown));
    return (<Portal>
      <div class="modal-backdrop" onClick={(e) => e.target === e.currentTarget && props.onClose()}>
        <div class="modal" role="dialog" aria-modal="true">
          <h2>Project limit reached</h2>
          <p>
            Your <strong>{props.tier}</strong> plan allows up to{' '}
            <strong>{props.limit} project{props.limit !== 1 ? 's' : ''}</strong>. Upgrade to Pro for unlimited projects.
          </p>
          <div class="modal-actions">
            <button class="btn btn-outline" onClick={props.onClose}>Cancel</button>
            <A href="/#pricing" class="btn btn-primary" onClick={props.onClose}>View plans</A>
          </div>
        </div>
      </div>
    </Portal>);
}
// ── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteModal(props) {
    function handleKeyDown(e) {
        if (e.key === 'Escape')
            props.onClose();
    }
    onMount(() => window.addEventListener('keydown', handleKeyDown));
    return (<Portal>
      <div class="modal-backdrop" onClick={(e) => e.target === e.currentTarget && props.onClose()}>
        <div class="modal" role="dialog" aria-modal="true">
          <h2>Delete project?</h2>
          <p>
            <strong>"{props.project.name}"</strong> will be permanently deleted. This cannot be undone.
          </p>
          <div class="modal-actions">
            <button class="btn btn-outline" onClick={props.onClose}>Cancel</button>
            <button class="btn btn-primary" style={{ background: '#ef4444' }} onClick={props.onConfirm}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </Portal>);
}
// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard(props) {
    return (<div class="project-card" onClick={props.onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && props.onOpen()}>
      <div class="project-card-thumb">
        <Show when={props.project.thumbnail} fallback={<span>⚡</span>}>
          <img src={props.project.thumbnail} alt=""/>
        </Show>
      </div>
      <div class="project-card-body">
        <div class="project-card-name">{props.project.name}</div>
        <div class="project-card-meta">Updated {formatDate(props.project.updatedAt)}</div>
        <Show when={props.project.description}>
          <div class="project-card-meta" style={{ color: '#475569', 'margin-top': '0.25rem' }}>
            {props.project.description}
          </div>
        </Show>
      </div>
      <div class="project-card-footer" onClick={(e) => e.stopPropagation()}>
        <button class="btn btn-ghost" title="Export" onClick={props.onExport}>↓</button>
        <button class="btn btn-danger-ghost" title="Delete" onClick={props.onDelete}>✕</button>
      </div>
    </div>);
}
// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const auth = useAuthStore();
    const store = useProjectStore();
    const navigate = useNavigate();
    const [showNewModal, setShowNewModal] = createSignal(false);
    const [limitInfo, setLimitInfo] = createSignal(null);
    const [deleteTarget, setDeleteTarget] = createSignal(null);
    onMount(() => { store.loadProjects(); });
    const tier = () => getUserTierLabel(auth.user);
    const isPaidUser = () => tier() === 'pro' || tier() === 'ultimate';
    const isGuest = () => auth.isGuest();
    async function handleCreate(name, description) {
        try {
            const project = await store.createProject(name, description);
            navigate(`/sim?project=${project.id}`);
        }
        catch (err) {
            if (err instanceof ProjectLimitError) {
                setLimitInfo({ tier: err.tier, limit: err.limit });
                throw err;
            }
            throw err;
        }
    }
    function handleNewProjectClick() {
        const limit = PROJECT_LIMITS[tier()];
        if (store.projects().length >= limit) {
            setLimitInfo({ tier: tier(), limit });
        }
        else {
            setShowNewModal(true);
        }
    }
    async function handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.fermion.json';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file)
                return;
            try {
                const project = await store.importProject(file);
                navigate(`/sim?project=${project.id}`);
            }
            catch (err) {
                if (err instanceof ProjectLimitError) {
                    setLimitInfo({ tier: err.tier, limit: err.limit });
                }
                else {
                    alert(err instanceof Error ? err.message : 'Import failed');
                }
            }
        };
        input.click();
    }
    async function handleDeleteConfirm() {
        const target = deleteTarget();
        if (!target)
            return;
        await store.deleteProject(target.id);
        setDeleteTarget(null);
    }
    function handleSignOut() {
        auth.signOut();
        navigate('/');
    }
    return (<div class="dashboard">
      {/* Nav */}
      <nav class="dashboard-nav">
        <A href="/" class="dashboard-nav-brand">
          Fermion<span>.io</span>
        </A>
        <div class="dashboard-nav-right">
          <Show when={isPaidUser()}>
            <label class="sync-toggle" title="Sync projects to cloud">
              <input type="checkbox" checked={store.cloudSyncEnabled()} onChange={store.toggleCloudSync}/>
              Cloud sync
            </label>
          </Show>
          <Show when={auth.user()}>
            <span class="dashboard-user-email">{auth.user()?.email}</span>
          </Show>
          <button class="btn btn-outline" onClick={openThemePalette} title="Change theme (Ctrl+T)" style={{ padding: '0.35rem 0.7rem', 'border-radius': '50%', width: '34px', height: '34px' }}>
            ◐
          </button>
          <button class="btn btn-outline" onClick={handleSignOut}>Sign out</button>
        </div>
      </nav>

      <main class="dashboard-main">
        {/* Guest banner */}
        <Show when={isGuest()}>
          <div class="guest-banner">
            <p>You're browsing as a guest. Sign up to save your work and access all features.</p>
            <A href="/?login=1" class="btn btn-primary">Create account</A>
          </div>
        </Show>

        {/* Syncing indicator */}
        <Show when={store.syncing()}>
          <div class="sync-banner">
            <div class="sync-dot"/>
            Syncing with cloud…
          </div>
        </Show>

        {/* Header */}
        <div class="dashboard-header">
          <h1 class="dashboard-title">Projects</h1>
          <div class="dashboard-header-actions">
            <button class="btn btn-outline" onClick={handleImport}>Import</button>
            <button class="btn btn-primary" onClick={handleNewProjectClick}>+ New project</button>
          </div>
        </div>

        {/* Grid */}
        <div class="project-grid">
          {/* New-project shortcut card */}
          <div class="project-card-new" role="button" tabIndex={0} onClick={handleNewProjectClick} onKeyDown={(e) => e.key === 'Enter' && handleNewProjectClick()}>
            <span class="project-card-new-icon">+</span>
            New project
          </div>

          <Show when={store.projects().length === 0 && !store.syncing()}>
            <div class="dashboard-empty">
              <div class="dashboard-empty-icon">⚡</div>
              <p>No projects yet. Create your first circuit to get started.</p>
            </div>
          </Show>

          <For each={store.projects()}>
            {(project) => (<ProjectCard project={project} onOpen={() => {
                store.setActiveProject(project.id);
                navigate(`/sim?project=${project.id}`);
            }} onDelete={() => setDeleteTarget(project)} onExport={() => store.exportProject(project.id)}/>)}
          </For>
        </div>
      </main>

      {/* Modals */}
      <Show when={showNewModal()}>
        <NewProjectModal onClose={() => setShowNewModal(false)} onCreate={handleCreate}/>
      </Show>

      <Show when={limitInfo()}>
        {(info) => (<LimitModal tier={info().tier} limit={info().limit} onClose={() => setLimitInfo(null)}/>)}
      </Show>

      <Show when={deleteTarget()}>
        {(target) => (<DeleteModal project={target()} onConfirm={handleDeleteConfirm} onClose={() => setDeleteTarget(null)}/>)}
      </Show>
    </div>);
}
//# sourceMappingURL=Dashboard.jsx.map