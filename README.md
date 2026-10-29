# Kitchen Notes · Mobile recipe prototype

## Try it now

Unzip this folder, then **double-click `index.html`** in your browser (phone or computer). The 22 included recipes are bundled in `bundled-recipes.js`, so no server is required for testing. You can also upload the folder to a GitHub repository and enable GitHub Pages.

## Features

- Mobile-first layout for browsing recipes, with search by title, tags or ingredient.
- Scale by multiplier or quantity of the recipe's designated main ingredient; scale by servings when original servings are defined.
- Full ingredient list, grouped by cooking phase, plus method and notes.
- Cook Mode with one step per screen, quantities used by that step, next-step preview, progress indicator, and swipe/tap navigation.
- Saves most recent recipe, factor, and position in local browser storage (but opening a recipe afresh begins at Step 1).
- No account, backend, or internet connection needed for bundled recipes.

## Adding recipes

The files under `recipes/` are the JSON source-of-truth. For this offline-capable prototype, after adding another JSON file, also regenerate `bundled-recipes.js`:

```python
import glob, json
recipes = [json.load(open(p, encoding='utf-8')) for p in sorted(glob.glob('recipes/*.json'))]
with open('bundled-recipes.js', 'w', encoding='utf-8') as f:
    f.write('window.BUNDLED_RECIPES = ' + json.dumps(recipes, ensure_ascii=False, indent=2) + ';\n')
```

There is no need for a server or build pipeline, but adding recipes **does** currently require rebuilding the bundle. Later we can automate that with GitHub Actions.

## Important limitations

- This is a prototype, not a final publication. Initial recipes contain reconstructed cooking instructions and intentionally unknown carb/yield values. Review recipes before relying on them.
- Some step instructions contain fixed times or old example amounts. **Use displayed scaled ingredient quantities** in Cook Mode; cooking times and temperatures are not mathematically rescaled.
- Serving-based scaling is disabled for recipes with unknown original serving counts.
- One ingredient may appear in more than one phase if used in separate steps; ingredient amounts shown under a phase may represent the *whole batch* for that ingredient. The per-step quantity override in Cook Mode handles specific allocations when available. Future schema revisions can make per-phase totals more precise.
- Step navigation supports swipe and large buttons, but no timer/keep-screen-awake feature yet.

## v1.1 feedback fixes
- All cooking-mode entry buttons now preserve your last step for the recipe. To restart, use Previous until step 1 (a dedicated restart action can be added later).
- Ingredient amounts display as kitchen fractions/approximations rather than arbitrary decimals. For cup amounts close to an extra tablespoon, a mixed measure may display (for example, 1/2 cup + 1 tbsp). Rounding is presentation only; scaling calculations retain full numeric precision.
- Butter Chicken onion is measured in cups diced. An approximate medium-onion conversion is retained only in the kitchen notes, not as a fixed ingredient label that would become incorrect after rescaling. This is a recipe-level correction; a future ingredient-conversions reference can generalize it across recipes.
- Step instructions occasionally embed original quantities; rescale using the ingredient quantities shown separately until those instructions are made quantity-independent.

## v1.2 fix
- Removed the fixed “about 1 medium onion” text from Butter Chicken’s onion ingredient label. It now reads “Onion · diced” beside the automatically scaled cup amount.
- Mixed cup amounts use “cups” in plural where appropriate.


## Archive migration (October 23, 2026)
The archive migration contained 21 approved recipe records: 5 original test recipes plus 16 additions. Six provisional entries were excluded at the user’s request; the Chocolate Chip Cookie Variation and Gin and Tonic were retained. See MIGRATION-REPORT.md. Many early recipes have missing quantities (null); they are not yet dependable for automatic scaling.

## Quantity completion update

All 21 originally approved recipes contain numeric ingredient quantities and units. Previously unknown values were supplied as practical **editorial defaults**, distinguished with `quantity_origin: "reconstructed_default"`; read `QUANTITY-AUDIT.md` for a per-recipe list. The index, combined file and offline app bundle were synchronized. Total carbohydrate values are still intentionally absent pending a separate nutrition verification pass.

## Fresh garlic & ginger variant (October 29, 2026)

Added a separate **Butter Chicken — Fresh Garlic & Ginger** recipe, alongside the unchanged **Butter Chicken — Spice-Kit Version**. Both use the same 1.75-lb chicken standardization. The fresh version replaces the marinade and sauce garlic powder (0.75 tsp each) with 3 minced garlic cloves each, and the ground ginger (0.75 tsp each) with 1 tbsp freshly grated ginger each. It adds a brief garlic/ginger sauté after the onions soften, before the tomato paste and other spices. The new quantities are editorial substitutions, not a tested historical recipe. The JSON, index, all-recipes.json and offline app bundle now contain **22 recipes**. Carbohydrate calculations remain pending.
