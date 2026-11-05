# MurineMatchTx User Manual Revision Design

## Goal

Revise the English user manual function by function so that each entry documents the current package interface, tells users how to prepare the required inputs, provides an adaptable example, and explains the result within the package's intended exploratory scope.

## Scope

- Keep `index.md` as the single user-facing manual.
- Preserve the existing Jekyll layout and navigation.
- Revise the existing introduction, shared input guidance, and 16 function entries without restructuring the site into a multi-page tutorial.
- Align function arguments, inputs, outputs, and examples with the installed package source. Use the COAD, LUAD, and BRCA scripts and their generated figures as implementation evidence.
- Write concise, generic examples that users can adapt to their own paths, datasets, and model names. The manual will not reproduce the three analysis scripts verbatim.
- Modify only the `MurineMatchTxManual` repository. Package source, analysis scripts, datasets, and manuscript files remain unchanged.

## Content Structure

1. Introduce MurineMatchTx as a standardized exploratory workflow for relative transcriptomic comparison.
2. Replace the current general input list with preparation instructions for DEG tables, expression matrices, sample metadata, orthology mappings, TPM matrices, and optional clinical or CNV annotations.
3. Retain the function reference and update every entry to match the current interface.
4. Give each function entry the same practical sequence: purpose, prepared input, current arguments, returned value and files, adaptable example, and interpretation notes.
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
- Check that examples use the same validated data flow demonstrated by the three analysis scripts without copying cancer-specific paths or complete scripts.
- Run the existing documentation-site test.
- Scan internal links and referenced assets.
- Scan for prohibited or overbroad claims from the terminology specification.
- Review the final diff to confirm that no R package file or analysis script changed.
