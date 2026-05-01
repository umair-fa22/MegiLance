import os
import re

LIGHT_MAP = {
    '#ffffff': 'var(--bg-primary-light)',
    '#f8fafc': 'var(--bg-secondary-light)',
    '#f1f5f9': 'var(--bg-tertiary-light)',
    '#0f172a': 'var(--text-primary-light)',
    '#475569': 'var(--text-secondary-light)',
    '#94a3b8': 'var(--text-tertiary-light)',
    '#1e293b': 'var(--color-text-primary-light)',
    '#64748b': 'var(--color-text-secondary-light)',
    '#e2e8f0': 'var(--border-light)',
    '#4573df': 'var(--ml-blue)',
    '#6b93f5': 'var(--ml-blue-light)',
    '#2952b8': 'var(--ml-blue-dark)',
    '#ff9800': 'var(--ml-orange)',
    '#e81123': 'var(--ml-red)',
    '#27ae60': 'var(--ml-green)',
    '#f2c94c': 'var(--ml-yellow)'
}

DARK_MAP = {
    '#0f172a': 'var(--bg-primary-dark)',
    '#1e293b': 'var(--bg-secondary-dark)',
    '#334155': 'var(--bg-tertiary-dark)',
    '#f8fafc': 'var(--text-primary-dark)',
    '#cbd5e1': 'var(--text-secondary-dark)',
    '#94a3b8': 'var(--text-tertiary-dark)',
    '#f1f5f9': 'var(--color-text-primary-dark)',
    '#334155': 'var(--border-dark)',
    '#4573df': 'var(--ml-blue)',
    '#6b93f5': 'var(--ml-blue-light)',
    '#2952b8': 'var(--ml-blue-dark)',
    '#ff9800': 'var(--ml-orange)',
    '#e81123': 'var(--ml-red)',
    '#27ae60': 'var(--ml-green)',
    '#f2c94c': 'var(--ml-yellow)'
}

def replace_colors(filepath, color_map):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for hex_code, token in color_map.items():
        pattern = re.compile(re.escape(hex_code) + r'(?!\w)', re.IGNORECASE)
        content = pattern.sub(token, content)
    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    root_dir = 'frontend/app'
    files_changed = 0
    for subdir, _, files in os.walk(root_dir):
        for file in files:
            path = os.path.join(subdir, file)
            if file.endswith('.light.module.css'):
                if replace_colors(path, LIGHT_MAP):
                    files_changed += 1
            elif file.endswith('.dark.module.css'):
                if replace_colors(path, DARK_MAP):
                    files_changed += 1
            elif file.endswith('.common.module.css') or file.endswith('.css'):
                if replace_colors(path, LIGHT_MAP): # fallback
                    files_changed += 1
    print(f'Changed {files_changed} files.')

if __name__ == '__main__':
    main()
