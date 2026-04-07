import os

css_files = [
    'E:/MegiLance/frontend/app/(portal)/admin/dashboard/AdminDashboard.common.module.css',
    'E:/MegiLance/frontend/app/(portal)/admin/dashboard/AdminDashboard.light.module.css',
    'E:/MegiLance/frontend/app/(portal)/admin/dashboard/AdminDashboard.dark.module.css',
    'E:/MegiLance/frontend/app/(portal)/client/dashboard/ClientDashboard.common.module.css',
    'E:/MegiLance/frontend/app/(portal)/client/dashboard/ClientDashboard.light.module.css',
    'E:/MegiLance/frontend/app/(portal)/client/dashboard/ClientDashboard.dark.module.css',
    'E:/MegiLance/frontend/app/(portal)/freelancer/dashboard/Dashboard.common.module.css',
    'E:/MegiLance/frontend/app/(portal)/freelancer/dashboard/Dashboard.light.module.css',
    'E:/MegiLance/frontend/app/(portal)/freelancer/dashboard/Dashboard.dark.module.css'
]

common_css = '''
/* Added for 2026 motion aesthetics */
.motionWrapper {
  width: 100%;
}
.glassPanel {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
}
.cardHover {
  will-change: transform, box-shadow;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
}
.cardHover:hover {
  transform: translateY(-4px) scale(1.01);
  z-index: 10;
}
'''

light_css = '''
.glassPanel {
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.4);
}
.cardHover:hover {
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
}
'''

dark_css = '''
.glassPanel {
  background: rgba(30, 30, 36, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}
.cardHover:hover {
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.1);
}
'''

for file in css_files:
    if not os.path.exists(file):
        print(f"Not found: {file}")
        continue
    content = ""
    if 'common' in file:
        content = common_css
    elif 'light' in file:
        content = light_css
    elif 'dark' in file:
        content = dark_css
        
    with open(file, 'a', encoding='utf-8') as f:
        f.write('\\n' + content)
    print(f"Updated {file}")
