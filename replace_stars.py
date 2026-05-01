import os
import re

files_to_check = [
    'frontend/app/(main)/gigs/[slug]/GigDetail.tsx',
    'frontend/app/(main)/freelancers/PublicFreelancers.tsx',
    'frontend/app/(main)/explore/Explore.tsx',
    'frontend/app/components/Review/ReviewForm/ReviewForm.tsx'
]

for filepath in files_to_check:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace specific hardcoded colors in fill and color props
        # pattern: fill="#[a-fA-F0-9]+" or color="#[a-fA-F0-9]+"
        
        content = re.sub(r'fill=[\'"]#(ffc107|facc15|eab308)[\'"]', 'fill=\"var(--ml-yellow)\"', content, flags=re.IGNORECASE)
        content = re.sub(r'color=[\'"]#(ffc107|facc15|eab308)[\'"]', 'color=\"var(--ml-yellow)\"', content, flags=re.IGNORECASE)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Processed {filepath}')
