import { createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
export function SaveModal(props) {
    const [name, setName] = createSignal('My Project');
    const [saving, setSaving] = createSignal(false);
    let inputRef;
    async function handleSave() {
        const n = name().trim();
        if (!n)
            return;
        setSaving(true);
        try {
            await props.onSave(n);
        }
        finally {
            setSaving(false);
        }
    }
    function handleKeyDown(e) {
        if (e.key === 'Enter')
            void handleSave();
        if (e.key === 'Escape')
            props.onCancel();
    }
    return (<Portal mount={document.body}>
      <div class="modal-backdrop" onClick={props.onCancel}>
        <div class="modal-panel" onClick={(e) => e.stopPropagation()}>
          <div class="modal-title">Save project</div>

          <div class="modal-field">
            <label class="modal-label">Project name</label>
            <input ref={inputRef} class="modal-input" type="text" value={name()} onInput={(e) => setName(e.currentTarget.value)} onKeyDown={handleKeyDown} autofocus maxLength={100}/>
          </div>

          <div class="modal-actions">
            <button class="modal-btn-cancel" onClick={props.onCancel}>
              Cancel
            </button>
            <button class="modal-btn-save" onClick={() => void handleSave()} disabled={saving() || !name().trim()}>
              {saving() ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </Portal>);
}
//# sourceMappingURL=SaveModal.jsx.map