import type { UserTier } from '@fermion/core';
interface SidebarProps {
    userTier: () => UserTier;
    onUpgradePrompt?: (() => void) | undefined;
}
export declare function ComponentSidebar(props: SidebarProps): import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=ComponentSidebar.d.ts.map