"""Rebuild every page from the builder, then zip the .txt deliverables."""
import subprocess, sys, zipfile, os
for s in ['page_home.py','page_about.py','page_club.py','page_match.py','page_makeover.py','blog_embeds.py']:
    subprocess.run([sys.executable, s], check=True)
root = os.path.dirname(os.path.abspath(__file__))
with zipfile.ZipFile(os.path.join(root, 'Champagne_and_Savings_Site_Codes.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
    for f in sorted(os.listdir(os.path.join(root, 'txt'))):
        z.write(os.path.join(root, 'txt', f), f)
    z.write(os.path.join(root, 'INSTALL.md'), 'INSTALL.md')
print('zip ready')
