#!/bin/bash

echo "Renaming files back to original names"

# ANSI color codes
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Find all *.*.html files and rename them back to *.html.*
find . -type f -name "*.*html" | while read file; do
    filename=$(basename "$file")
    dir=$(dirname "$file")
    
    # Skip files that don't match our pattern (need to have two dots)
    if [[ $(echo "$filename" | grep -o "\." | wc -l) -lt 2 ]]; then
        continue
    fi
    
    # Extract parts using parameter expansion
    base=${filename%.*}
    
    # Ensure we're dealing with a *.*.html file
    if [[ "$file" == *.*html ]]; then
        # Get the middle extension
        middle_ext=${base##*.}
        # Get the first part of the name
        first_part=${base%.*}
        
        # Rename the file
        new_name="${first_part}.html.${middle_ext}"
        mv "$file" "$dir/$new_name"
    fi
done

echo -e "${GREEN}Done: $(date)${NC}" 