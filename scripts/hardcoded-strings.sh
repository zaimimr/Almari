#!/bin/sh
screens=$(grep -rnE --include='*.ts' --include='*.tsx' \
  -e '=\s*\{?\s*["`][A-Z]' \
  -e '[A-Za-z]+:\s*["`][A-Z]' \
  -e '>[^<>{}]*[A-Za-z]{2,}[^<>{}]*</' \
  -e "^\s+[A-Z][a-z']*,? [a-z]" \
  -e '^\s*([?:]\s*|return\s+)?["`][A-Z]' \
  -e '\(\s*["`][A-Z]' \
  -e '["`][,.]? ?· [A-Z]' \
  -e '["`][,.] [a-z ]+["`]' \
  -e '=== 1 \?\s*["`][a-z]+( [a-z]+)*["`]' \
  -e '\?\s*["`][a-z]+ [a-z ]+["`]\s*:' \
  -e '\$\{[^}]*\},? [a-z]{2,}' \
  app src/ui src/features src/navigation | grep -v 'fontFamily')
domain=$(grep -nE \
  -e '(message|reason):\s*["`][A-Z]' \
  -e 'Error\(\s*["`][A-Z]' \
  -e '(missing|gap|uncovered)\(\s*["`][A-Z]' \
  -e '^\s*([?:]\s*|return\s+)?["`][A-Z][a-z]* [a-z]' \
  -e 'not marked' \
  src/domain/styling.ts src/domain/closet.ts src/domain/today.ts src/domain/coverage.ts src/domain/pieceWeather.ts src/domain/wardrobe.ts)
if [ -n "$screens$domain" ]; then
  printf '%s\n%s\n' "$screens" "$domain" | sed '/^$/d'
  exit 1
fi
echo "No hard-coded user-facing text."
