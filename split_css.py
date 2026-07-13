import os

with open('src/assets/css/game.css', 'r') as f:
    lines = f.readlines()

def find_line(pattern):
    for i, line in enumerate(lines):
        if pattern in line:
            return i
    return -1

# Extract Modals
modals_start_1 = find_line("/* Load Saves Modal Styles */")
modals_end_1 = find_line("/* Base Regions Styles */") # Wait, check where scoring modal ends
# Let's just create logical blocks
