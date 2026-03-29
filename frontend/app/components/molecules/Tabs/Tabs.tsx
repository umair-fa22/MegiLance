// @AI-HINT: This is a fully accessible, theme-aware, and self-contained compound Tabs component. It follows the WAI-ARIA design pattern for tabs, ensuring proper roles, states, and keyboard navigation.
'use client';

import React, {
  useState, createContext, useContext, useId, Children, isValidElement, cloneElement, useRef, useEffect, KeyboardEvent, FC, ReactNode, ForwardRefExoticComponent, RefAttributes, forwardRef, ForwardedRef
} from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './Tabs.common.module.css';
import lightStyles from './Tabs.light.module.css';
import darkStyles from './Tabs.dark.module.css';

// 1. CONTEXT & HOOK
interface TabsContextProps {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  tabsId: string;
  themeStyles: Record<string, string>;
}
const TabsContext = createContext<TabsContextProps | null>(null);
export const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('useTabs must be used within a <Tabs> component.');
  return context;
};

// 2. PROP TYPES
interface TabProps { children: ReactNode; icon?: ReactNode; disabled?: boolean; index?: number; }
interface TabPanelProps { children: ReactNode; index?: number; }
interface TabsListProps { children: ReactNode; className?: string; }
interface TabsPanelsProps { children: ReactNode; className?: string; }
interface TabsProps { children: ReactNode; defaultIndex?: number; className?: string; onTabChange?: (index: number) => void; }

// 3. SUB-COMPONENTS

const Tab = forwardRef<HTMLButtonElement, TabProps>(({ children, icon, disabled, index }, ref) => {
  const { selectedIndex, setSelectedIndex, tabsId, themeStyles } = useTabs();
  const isSelected = selectedIndex === index;
  return (
    <button ref={ref} role="tab" type="button" id={`${tabsId}-tab-${index}`} aria-controls={`${tabsId}-panel-${index}`} aria-selected={isSelected ? 'true' : 'false'} tabIndex={isSelected ? 0 : -1} onClick={() => !disabled && index !== undefined && setSelectedIndex(index)} disabled={disabled} className={cn(commonStyles.tabsTab, themeStyles.tabsTab, isSelected && [commonStyles.tabsTabSelected, themeStyles.tabsTabSelected], disabled && [commonStyles.tabsTabDisabled, themeStyles.tabsTabDisabled])}>
      {icon && <span className={commonStyles.tabIcon}>{icon}</span>}
      <span className={commonStyles.tabLabel}>{children}</span>
    </button>
  );
});
Tab.displayName = 'Tab';

const TabsList: FC<TabsListProps> = ({ children, className }) => {
  const { selectedIndex, setSelectedIndex, themeStyles } = useTabs();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => { tabRefs.current[selectedIndex]?.focus(); }, [selectedIndex]);

  // Measure active tab to position the animated indicator
  useEffect(() => {
    const el = tabRefs.current[selectedIndex];
    if (el && listRef.current) {
      const listRect = listRef.current.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      setIndicator({ left: rect.left - listRect.left, width: rect.width });
    }
  }, [selectedIndex, children]);

  useEffect(() => {
    const onResize = () => {
      const el = tabRefs.current[selectedIndex];
      if (el && listRef.current) {
        const listRect = listRef.current.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        setIndicator({ left: rect.left - listRect.left, width: rect.width });
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [selectedIndex]);

  // Apply CSS variables without JSX inline style to satisfy linters
  useEffect(() => {
    if (listRef.current) {
      listRef.current.style.setProperty('--indicator-left', `${indicator.left}px`);
      listRef.current.style.setProperty('--indicator-width', `${indicator.width}px`);
    }
  }, [indicator.left, indicator.width]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Children.toArray(children).filter(child => isValidElement(child) && !(child.props as TabProps).disabled);
    const count = tabs.length;
    if (count === 0) return;
    let newIndex = selectedIndex;
    if (e.key === 'ArrowRight') newIndex = (selectedIndex + 1) % count;
    else if (e.key === 'ArrowLeft') newIndex = (selectedIndex - 1 + count) % count;
    else if (e.key === 'Home') newIndex = 0;
    else if (e.key === 'End') newIndex = count - 1;
    if (newIndex !== selectedIndex) { e.preventDefault(); setSelectedIndex(newIndex); }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn(commonStyles.tabsList, themeStyles.tabsList, className)}
    >
      {Children.map(children, (child, index) => {
        if (isValidElement(child) && child.type === Tab) {
          const childWithRef = child as React.ReactElement<any>;
          return cloneElement(childWithRef as any, {
            index,
            ref: (el: HTMLButtonElement | null) => {
              tabRefs.current[index] = el;
              const r: any = (childWithRef as any).ref;
              if (typeof r === 'function') r(el);
            },
          } as any);
        }
        return child;
      })}
      <div className={cn(commonStyles.tabsIndicator, themeStyles.tabsIndicator)} aria-hidden="true" role="presentation" />
    </div>
  );
};
TabsList.displayName = 'TabsList';

const TabPanel: FC<TabPanelProps> = ({ children, index }) => {
  const { selectedIndex, tabsId, themeStyles } = useTabs();
  const isSelected = selectedIndex === index;
  return (
    <div
      role="tabpanel"
      id={`${tabsId}-panel-${index}`}
      aria-labelledby={`${tabsId}-tab-${index}`}
      hidden={!isSelected}
      className={cn(commonStyles.tabsPanel, themeStyles.tabsPanel)}
    >
      {isSelected && children}
    </div>
  );
};
TabPanel.displayName = 'TabPanel';

const TabsPanels: FC<TabsPanelsProps> = ({ children, className }) => {
  const { themeStyles } = useTabs();
  return (
    <div className={cn(commonStyles.tabsPanels, themeStyles.tabsPanels, className)}>
      {Children.map(children, (child, index) => {
        if (isValidElement(child) && child.type === TabPanel) {
          return cloneElement(child as React.ReactElement<TabPanelProps>, { index });
        }
        return child;
      })}
    </div>
  );
};
TabsPanels.displayName = 'TabsPanels';

// 4. MAIN COMPONENT
interface TabsComponent extends FC<TabsProps> {
  List: FC<TabsListProps>;
  Tab: ForwardRefExoticComponent<TabProps & RefAttributes<HTMLButtonElement>>;
  Panels: FC<TabsPanelsProps>;
  Panel: FC<TabPanelProps>;
}

const Tabs: TabsComponent = ({ children, defaultIndex = 0, className = '', onTabChange }) => {
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  const tabsId = useId();
  const { resolvedTheme } = useTheme();

  const handleSetSelectedIndex = (index: number) => {
    setSelectedIndex(index);
    if (onTabChange) onTabChange(index);
  };

  // Always render to avoid hydration mismatch
  // Default to light theme during SSR, will hydrate correctly on client
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <TabsContext.Provider value={{ selectedIndex, setSelectedIndex: handleSetSelectedIndex, tabsId, themeStyles }}>
      <div className={cn(commonStyles.tabs, themeStyles.tabs, className)}>{children}</div>
    </TabsContext.Provider>
  );
};

Tabs.List = TabsList;
Tabs.Tab = Tab;
Tabs.Panels = TabsPanels;
Tabs.Panel = TabPanel;

export default Tabs;
