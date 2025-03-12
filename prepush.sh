#!/bin/bash

echo "Renaming files to Apps Script format"

# ANSI color codes
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Find all *.html.* files and rename them to *.*.html
find . -type f -name "*.html.*" | while read file; do
    filename=$(basename "$file")
    dir=$(dirname "$file")
    
    # Extract parts using parameter expansion
    base=${filename%.*}
    ext=${filename##*.}
    
    # Rename the file
    new_name="${base%.*}.${ext}.html"
    mv "$file" "$dir/$new_name"
done

echo -e "${GREEN}Done: $(date)${NC}" 