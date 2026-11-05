# MurineMatchTx User Manual Function Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revise the English single-page manual so that all 16 function entries match the current MurineMatchTx interface and tell users how to prepare, run, and interpret each input and output.

**Architecture:** Keep `index.md` as the only user-facing content file and preserve the existing Jekyll shell. Revise the introduction, shared input guidance, function entries, and closing sections in place. Use the package source as the interface authority and the three cancer-type scripts as evidence for practical data flow without reproducing those scripts.

**Tech Stack:** Markdown, R examples, Jekyll, Python `unittest`, Git

## Global Constraints

- Write the manual in natural technical English.
- Apply the terminology and claim boundaries in `1.1_术语与结论边界规范.md`.
- Apply `anti-defensive-writing`: state positive scope directly and retain only conditions needed for correct use or interpretation.
- Modify only the `MurineMatchTxManual` repository.
- Do not change the MurineMatchTx R package, analysis scripts, datasets, or manuscript files.
- Do not reproduce the COAD, LUAD, and BRCA scripts verbatim.
- Use generic relative paths and user-defined model names in examples.

---

### Task 1: Establish the current interface inventory

**Files:**
- Read only: `I:/R/Transcript similarity analysis/MurineMatchTx_remote_clean/R/*.R`
- Read only: `I:/R/Transcript similarity analysis/wangdian_manual_figure_COAD.R`
- Read only: `I:/R/Transcript similarity analysis/wangdian_manual_figure_LUAD.R`
- Read only: `I:/R/Transcript similarity analysis/wangdian_manual_figure_BRCA.R`
- Modify: none

**Interfaces:**
- Consumes: the 16 exported functions listed in `index.md`.
- Produces: an authoritative checklist of current arguments, defaults, input contracts, return objects, written files, and downstream handoffs.

- [ ] **Step 1: Record the authoritative function signatures**

Use CodeGraph before direct source reads. Confirm that the manual documents these current additions: `deg_method`, `lfc_col`, `padj_col`, `gene_col`, `deg_thresholds`, `ortholog_map`, `mapping_source`, `sample_metadata`, `input_source`, `group_as`, `clustering_method`, and `scale_rows` where applicable.

- [ ] **Step 2: Record the shared input contracts**

Confirm the following preparation rules from source and tests:

- DEG inputs are `.tsv` or `.csv`; gene identifiers are row names or an explicit `gene_col`; method-specific fold-change and adjusted-p columns are numeric, finite, non-missing, and unique by gene.
- PCA expression files contain an `X` gene-ID column and unique sample columns; `sample_metadata` contains `sample_id`, `species`, `dataset`, `model`, and `tissue`.
- TROM receives a finite numeric gene-by-sample matrix and the same `sample_metadata` used for PCA.
- Count and TPM matrices contain non-negative finite values, unique gene-symbol row names, and unique sample-ID column names; external inputs declare `input_source`.
- Orthology mappings record stable/versioned human and mouse IDs, homology type, confidence, and release.

- [ ] **Step 3: Verify no write occurred outside the manual repository**

Run:

```powershell
git -C 'I:\R\Transcript similarity analysis\MurineMatchTx_remote_clean' status --short
```

Expected: the same package status observed before manual editing.

### Task 2: Revise the manual introduction and input preparation

**Files:**
- Modify: `index.md`

**Interfaces:**
- Consumes: the package positioning and shared input contracts from Task 1.
- Produces: a concise introduction and a user-preparation section referenced by all function entries.

- [ ] **Step 1: Replace promotional or admonitory wording**

Lead with this scope: MurineMatchTx provides a standardized exploratory workflow for relative transcriptomic comparison between human tumors and mouse cancer models. State that users select a module-specific endpoint for a prespecified research question.

- [ ] **Step 2: Replace the four-item input list**

Document six prepared input types: DEG tables, expression matrices, sample metadata, orthology mapping, count/TPM matrices, and optional clinical/CNV annotations. Include compact schema tables and an R example for reading each object.

- [ ] **Step 3: State the interpretation framework once**

Define DEG, uncorrected PCA, TROM, GO, TME, and metabolism endpoints. State once that module results remain separate and that TME/metabolism results from current human-reference signatures are exploratory descriptions.

### Task 3: Revise the 16 function entries

**Files:**
- Modify: `index.md`

**Interfaces:**
- Consumes: prepared objects and naming conventions from Task 2.
- Produces: current function reference entries with adaptable R examples.

- [ ] **Step 1: Revise functions 1–5 (DEG)**

Use one `thresholds <- list(log2fc = 1, fdr = 0.05)` object throughout. Show method-specific or custom column mapping, audited Compara input, and the `heatmap_data` handoff from `plot_DEG_heatmap()` to `plot_DEG_barplot()`.

- [ ] **Step 2: Revise functions 6–7 (PCA)**

Use explicit `sample_metadata`. Present uncorrected PCA as the default diagnostic view. Describe ComBat as an optional sensitivity analysis whose interpretation depends on whether dataset and species are confounded.

- [ ] **Step 3: Revise functions 8–11 (clinical/CNV and TROM)**

Show optional preparation of clinical/CNV annotations, then pass `pca_data$uncorrected_data` and `pca_data$sample_metadata` to `compute_similarity_matrix()`. Pass the returned annotated table, raw similarity matrix, and metadata to the heatmap. Describe scores as relative sample-associated gene-set overlap under the stated inputs and parameters.

- [ ] **Step 4: Revise function 12 (GO)**

Show `edgeR`, `DESeq2`, `limma`, and custom input compatibility; use the shared DEG threshold object; require symbols appropriate to the selected organism database; describe the output as clustered enriched GO themes.

- [ ] **Step 5: Revise functions 13–16 (TME and metabolism)**

Show separate raw-count and prepared-TPM paths with explicit `input_source`. Pass `tme_result$eset_tpm` independently to the TME boxplot and metabolism scorer. Pass `group_as` explicitly to `plot_metabolism_heatmap()` and document `relative_zscore`, `pearson`, and row scaling used by the demonstrated workflow.

### Task 4: Verify language, examples, and site integrity

**Files:**
- Verify: `index.md`
- Verify: `tests/test_docs_site.py`

**Interfaces:**
- Consumes: revised manual from Tasks 2–3.
- Produces: evidence that the manual renders, uses current arguments, and stays within the approved claim boundaries.

- [ ] **Step 1: Run the existing site test**

Run:

```powershell
python -m unittest tests.test_docs_site -v
```

Expected: all tests pass.

- [ ] **Step 2: Check the Markdown diff**

Run:

```powershell
git diff --check
git diff --stat
```

Expected: no whitespace errors; user-facing changes are confined to `index.md`.

- [ ] **Step 3: Scan terminology and stale interfaces**

Confirm that `index.md` contains no unconditional `best`, `optimal`, `objective selection`, `one-stop`, `broad applicability`, `publication-ready`, or `proves equivalence` claims. Confirm that obsolete examples do not rely on positional sample counts or a global `group_as` variable.

- [ ] **Step 4: Confirm repository boundaries**

Run `git status --short` in both the manual and package repositories. Expected: manual documentation changes are present; no package source file was changed by this task.
