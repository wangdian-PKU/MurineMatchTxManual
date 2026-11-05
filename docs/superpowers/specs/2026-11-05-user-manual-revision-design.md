# MurineMatchTx User Manual Revision Design

## Goal

Revise the English user manual so that it documents the current package interface through the COAD, LUAD, and BRCA analysis workflows and explains each module within the package's intended exploratory scope.

## Scope

- Keep `index.md` as the single user-facing manual.
- Preserve the existing Jekyll layout and navigation.
- Add a reproducible workflow shared by the three cancer-type examples.
- Align function arguments, inputs, outputs, and examples with the installed package source and the three `wangdian_manual_figure_*.R` scripts.
- Add representative outputs from `manual_figures` as manual assets when they clarify interpretation.
- Modify only the `MurineMatchTxManual` repository. Package source, analysis scripts, datasets, and manuscript files remain unchanged.

## Content Structure

1. Introduce MurineMatchTx as a standardized exploratory workflow for relative transcriptomic comparison.
2. Define the shared inputs, metadata schema, orthology mapping, thresholds, and output conventions.
3. Present a concise end-to-end example that users can adapt to COAD, LUAD, or BRCA through a cancer-specific configuration block.
4. Retain the function reference and update every entry to match the current interface.
5. Explain module-specific interpretation:
   - DEG: direction, coverage, and effect-size concordance relative to the stated thresholds.
   - Uncorrected PCA: global structure, outliers, source separation, and potential confounding.
   - TROM: relative overlap strength under the selected mapping and parameters.
   - GO: enriched themes under the stated gene universe and thresholds.
   - TME and metabolism: exploratory descriptions based on the selected human-reference signatures.
6. Keep module results separate; the manual will not define a global cross-module score.

## Writing Standard

Use direct, natural technical English. State each function's purpose, prerequisites, operation, output, and interpretation once. Preserve conditions that affect validity or correct use. Remove promotional language, repeated disclaimers, vague warnings, and claims that exceed the documented endpoint.

## Verification

- Compare documented signatures with the package source.
- Check that the three example configurations match their analysis scripts.
- Run the existing documentation-site test.
- Scan internal links and referenced assets.
- Scan for prohibited or overbroad claims from the terminology specification.
- review the final diff to confirm that no R package file or analysis script changed.
