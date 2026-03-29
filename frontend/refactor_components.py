import os
import re
import shutil

ATOMS = [
    'Badge', 'Button', 'Checkbox', 'Input', 'Label', 'Loader', 'Logo',
    'MegiLanceLogo', 'ProgressBar', 'ProgressRing', 'TagsInput', 
    'Textarea', 'ThemeToggleButton', 'ToggleSwitch', 'Tooltip', 'UserAvatar'
]

MOLECULES = [
    'Accordion', 'ActionMenu', 'ActivityTimeline', 'Alert', 'Breadcrumbs', 
    'Card', 'CurrencySelector', 'DashboardWidget', 'DatePicker', 'Dropdown',
    'EmptyState', 'FeatureStatusPill', 'FileUpload', 'FloatingActionButtons',
    'FloatingCTA', 'HireMeCard', 'Notification', 'Pagination', 'PaginationBar',
    'PaymentBadge', 'ProfileMenu', 'RadioGroup', 'RankGauge', 'Select',
    'SmartBanner', 'StarRating', 'StatCard', 'StatusIndicator', 'Table',
    'Tabs', 'ThemeSwitcher', 'TimeTracker', 'Toast', 'TransactionRow',
    'Trend', 'TrustStrip', 'VideoCall'
]

ORGANISMS = [
    'AnalyticsDashboard', 'AppChrome', 'CommandPalette', 'CookieConsent',
    'DataTableExtras', 'DataToolbar', 'EmailCapture', 'ErrorBoundary',
    'Footer', 'FraudAlerts', 'GigCard', 'GigGrid', 'Header', 'JobCard',
    'KPISparkline', 'LinkedAccounts', 'Messaging', 'MFASetup', 
    'MobileBottomNav', 'Modal', 'MultiStepForm', 'Newsletter', 'Notifications',
    'PaymentCard', 'PaymentHistory', 'PostProjectCard', 'ProfileCompleteness',
    'ProjectCard', 'QuickLogin', 'Search', 'SecuritySettings', 'SellerStats',
    'SettingsSection', 'Sidebar', 'SidebarNav', 'Slider', 'Wizard'
]

TEMPLATES = [
    'AppLayout', 'Layout', 'Layouts', 'PlaceholderPage'
]

MAPPING = {}
for comp in ATOMS: MAPPING[comp] = f"atoms/{comp}"
for comp in MOLECULES: MAPPING[comp] = f"molecules/{comp}"
for comp in ORGANISMS: MAPPING[comp] = f"organisms/{comp}"
for comp in TEMPLATES: MAPPING[comp] = f"templates/{comp}"

base_dir = r"E:\MegiLance\frontend\app\components"

# 1. Move directories
for comp, new_path in MAPPING.items():
    src = os.path.join(base_dir, comp)
    dest = os.path.join(base_dir, new_path)
    if os.path.exists(src) and not os.path.exists(dest):
        print(f"Moving {comp} -> {new_path}")
        try:
            shutil.move(src, dest)
        except Exception as e:
            print(f"Failed to move {comp}: {e}")

# 2. Update imports in all files in frontend directory
def update_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return
    
    new_content = content
    changed = False
    
    for comp, new_path in MAPPING.items():
        # Regex to match different import paths gracefully
        prefixes_str = r"(@\/components|@\/app\/components|\.\.\/components|\.\.\/\.\.\/components|\.\.\/\.\.\/\.\.\/components|\.\.\/\.\.\/\.\.\/\.\.\/components|components|\.\/\.\.\/components)"
        pattern = r"([\'\"])" + prefixes_str + r"\/" + comp + r"([/\"\'\w\.-]*)"
        
        def replacer(match):
            nonlocal changed
            changed = True
            quote = match.group(1)
            prefix = match.group(2)
            suffix = match.group(3)
            # handle the exact string replacement
            return f"{quote}{prefix}/{new_path}{suffix}"
            
        new_content = re.sub(pattern, replacer, new_content)

        # Handle intra-components relative imports like `import X from '../Button'`
        # This one is tricky. Let's just catch `from '../Button'` if it's currently inside a component folder.
        pattern2 = r"([\'\"])(\.\.\/)" + comp + r"([/\"\'\w\.-]*)"
        def replacer2(match):
            nonlocal changed
            changed = True
            quote = match.group(1)
            prefix = match.group(2)
            suffix = match.group(3)
            # if we are moving molecules to molecules, ../ atoms/Button is different.
            # a bit risky, let's fix compiler errors later manually.
            # but let's do a basic replace
            new_rel = new_path
            # For simplicity, we just change the name directly, but wait - if I moved the file to `atoms/Button`, and I am in `molecules/Card`, `../Button` -> `../../atoms/Button`.
            # We'll just run tsc and manually fix the relative intra-component imports using our script if it's too much, or grep.
            return match.group(0) # Do nothing for now
        
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")

for root, dirs, files in os.walk(r"E:\MegiLance\frontend"):
    if 'node_modules' in root or '.next' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts', '.js', '.jsx')):
            filepath = os.path.join(root, file)
            update_file(filepath)

print("Done Refactoring!")