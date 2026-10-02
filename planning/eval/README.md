# Rated outfits

`outfits.json` holds outfits with a rating, so the stylist can be measured on real judgement instead of on its own rules. `npm run evaluate` scores every outfit with the rules scorer and prints two numbers:

- **Pairwise ordering accuracy:** within each occasion and style, the share of pairs with different ratings that the stylist puts in the right order. Higher is better.
- **Requests with a bad outfit in the top three:** how many occasion and style groups rank an outfit rated `no` among their first three. The goal is 0.

The current file is a developer smoke set of 12 sample outfits. It only proves the script works. The real set comes from a session with her.

## File format

```json
{
  "version": 1,
  "rater": "who rated these, and when",
  "closet": "closet.json",
  "outfits": [
    {
      "id": "w1",
      "occasion": "work",
      "style": "western",
      "pieceIds": ["piece-id-1", "piece-id-2"],
      "rating": "would-wear",
      "note": "her words, if she gave a reason"
    }
  ]
}
```

- `closet` is a closet snapshot file next to `outfits.json`, or `null` to use only the sample closet. Sample pieces are always available by their `sample-...` ids.
- `occasion` is one of `everyday`, `work`, `dinner`, `eid`, `party`, `wedding`, `barat`. `style` is `western` or `desi`.
- `rating` is `no`, `ok` or `would-wear`.
- Outfits with the same occasion and style are compared with each other, so give each group at least four outfits, including at least one rated `no`.

## The rating session (manual, with her)

1. **Copy her closet.** On the simulator: `sqlite3 "$(find "$(xcrun simctl get_app_container "Closet Development" com.zaimimran.almari data)" -name 'ExpoSQLiteStorage' | head -1)" "select value from storage where key = 'closet.v3'" > planning/eval/closet.json`. On her iPhone: Xcode, Window, Devices and Simulators, select Almari, Download Container, and run the same `sqlite3` query on the downloaded `ExpoSQLiteStorage` file. `closet.json` is in `.gitignore`; it stays on this Mac and is never committed or shared.
2. **Build 60 to 100 outfits** from her pieces and the samples: about half Western and half Desi, spread over all seven occasions, with at least four per occasion and style group you use. Take most from Today's suggestions (screenshot each one and note the piece ids from `closet.json`) and add combinations she actually wears.
3. **Add about 15 deliberately bad outfits:** two nearly matching blacks or navies, two loud prints, two saturated colours that clash on large pieces, sneakers at a wedding, a knee-length kameez with a gharara, a lawn suit for a barat, two layers indoors.
4. **Rate together.** Show each outfit as a flat lay on the phone (Build a look with those pieces) and ask: would you wear this for that occasion? Record `no`, `ok` or `would-wear`, and write her reason in `note` in her own words. Do not show her the stylist's score or reasons first.
5. **Set** `"rater"` to her name and the date, and `"closet": "closet.json"`.
6. **Run** `npm run evaluate` and copy the two numbers into `planning/implementation/STATUS.md`. Part 7 runs the trained model on the same file.
7. Re-run after any rule book change. A change that lowers pairwise accuracy or puts a bad outfit in a top three needs a reason before it ships.
