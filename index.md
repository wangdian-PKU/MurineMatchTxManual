## Authors

Dian Wang and Guiwen Guan

---

## Introduction

**MurineMatchTx** provides a standardized exploratory workflow for relative transcriptomic comparison between human tumors and mouse cancer models. The package connects explicit input contracts, audited ortholog mapping,module-specific outputs, and package-native visualizations.

Select each module according to a prespecified research question and endpoint:

| Module | Primary use |
| :-- | :-- |
| DEG comparison | Compare tumor-versus-normal regulation direction, coverage, and effect size under a shared threshold definition. |
| PCA | Examine global expression structure, outliers, dataset separation, and potential confounding. |
| TROM | Compare sample-associated gene-set overlap under the selected expression data, mapping, and parameters. |
| GO enrichment | Summarize enriched functional themes under the selected DEG definition and organism annotation. |
| TME profiling | Describe immune-cell estimates produced by a selected human-reference deconvolution method. |
| Metabolism scoring | Describe metabolism-signature scores produced by a selected scoring method. |

The modules retain separate endpoints. Keep heterogeneous results separate and interpret disagreement against the research question. TME and metabolism results based on the current human-reference signatures provide exploratory, method-specific descriptions. Mouse-specific signatures or orthogonal immune and metabolic evidence are required for cross-species validation.

![MurineMatchTx workflow](./figure/workflow_MurineMatchTx.png)

---

## Installation

Install the package from GitHub and load it in the current R session:

```r
if (!requireNamespace("devtools", quietly = TRUE)) {
  install.packages("devtools")
}

devtools::install_github("wangdian-PKU/MurineMatchTx")
library(MurineMatchTx)
```

The analysis modules also use packages imported by MurineMatchTx, including TROM, IOBR, ComplexHeatmap, clusterProfiler, and organism annotation packages. Install any dependency reported as missing during package installation.

---

## Preparing input data

Prepare the input files before calling the analysis functions. Use unique sample IDs across datasets and keep the same sample order in each expression matrix, metadata table, and group vector.

### 1. DEG result files

`merge_DEG_datasets()`, `prepare_DEG_heatmap_data()`, and `GO_enrichment_analysis()` accept `.tsv` or `.csv` DEG result files. Each row represents one unique gene. Store gene identifiers as row names or provide the column name through `gene_col`.

| `deg_method` | Fold-change column | Adjusted-p column |
| :-- | :-- | :-- |
| `"edgeR"` | `logFC` | `FDR` |
| `"DESeq2"` | `log2FoldChange` | `padj` |
| `"limma"` | `logFC` | `adj.P.Val` |
| `"custom"` | Set with `lfc_col` | Set with `padj_col` |

Fold-change and adjusted-p columns must be numeric, finite, and complete. Adjusted-p values must lie between 0 and 1. Gene identifiers must be non-empty and unique within each file.

Example edgeR file:

```text
gene	logFC	FDR
ENSG00000141510	1.42	0.004
ENSG00000171862	-1.18	0.012
```

When the file contains an explicit `gene` column, set `gene_col = "gene"`. When `gene_col = NULL`, the first file column is read as row names.

Use one threshold object throughout the DEG workflow:

```r
deg_thresholds <- list(log2fc = 1, fdr = 0.05)
```

The package classifies a gene as upregulated when `logFC >= log2fc` and `FDR < fdr`, and as downregulated when `logFC <= -log2fc` and `FDR < fdr`.

### 2. Expression matrices for PCA and TROM

Prepare one human expression file and a named list of mouse expression files. Files may use `.tsv` or `.csv` format. The first column must be named `X` and contain unique gene identifiers; all remaining columns are unique sample IDs. Values used for TROM must be finite and numeric.

```text
X	human_normal_01	human_tumor_01
ENSG00000141510	5.21	7.04
ENSG00000171862	3.88	2.17
```

`prepare_PCA_data()` retains genes present in every supplied file. Harmonize gene identifiers before analysis so that the intersection represents the intended cross-species feature set.

Prepare a sample metadata table with one row per expression column:

| Column | Required values |
| :-- | :-- |
| `sample_id` | Exact expression-matrix column name; unique and non-empty. |
| `species` | `human` or `mouse`. |
| `dataset` | Dataset identifier used for labels and batch annotation. |
| `model` | Human reference or mouse-model name. |
| `tissue` | `normal` or `tumor`. |

Optional columns such as `batch`, `pair_id`, and `subtype` are retained.

```r
sample_metadata <- read.delim(
  "data/sample_metadata.tsv",
  check.names = FALSE
)

required_metadata <- c(
  "sample_id", "species", "dataset", "model", "tissue"
)
stopifnot(all(required_metadata %in% names(sample_metadata)))
```

### 3. Ortholog mapping

The primary DEG heatmap path requires a frozen, versioned ortholog table. Prepare a `.tsv` file with these columns:

| Column | Content |
| :-- | :-- |
| `human_gene_id` | Stable human gene ID without a version suffix. |
| `mouse_gene_id` | Stable mouse gene ID without a version suffix. |
| `human_gene_id_version` | Versioned human gene ID. |
| `mouse_gene_id_version` | Versioned mouse gene ID. |
| `homology_type` | Ensembl homology class, including `ortholog_one2one`. |
| `is_high_confidence` | Logical, numeric, or text confidence flag. |
| `release` | Mapping resource and release identifier. |

```r
ortholog_map <- read.delim(
  "data/ensembl_compara_strict_one2one.tsv",
  check.names = FALSE
)
```

The package audits identifier completeness, version consistency, homology type, confidence, and duplicated stable IDs. Gene symbols may be retained as display labels, but stable IDs control the join.

### 4. Count and TPM matrices for TME and metabolism modules

Prepare a numeric gene-by-sample matrix with unique gene symbols as row names and unique sample IDs as column names. Values must be finite and non-negative.

- Raw counts must be non-negative whole numbers. Use `input_type = "count"` and `input_source = "raw_count"`.
- Prepared TPM values may be continuous. Use `input_type = "TPM"` and `input_source = "provided_tpm"`.
- A matrix returned by `plot_TME_barplot()` carries its source record and can be passed directly to downstream TME and metabolism functions.
- Use only raw counts or TPM values for these modules; keep ComBat-corrected expression in PCA sensitivity analyses.

The package converts raw counts with the human setting in `IOBR::count2tpm()`. For mouse or mixed-species analyses, calculate TPM with the appropriate species annotation before using MurineMatchTx, then declare `input_source = "provided_tpm"`.

Read a prepared TPM matrix with gene symbols in the first column:

```r
tpm_matrix <- as.matrix(read.delim(
  "data/expression_tpm.tsv",
  row.names = 1,
  check.names = FALSE
))
storage.mode(tpm_matrix) <- "double"
```

Use the same pattern for a raw-count matrix and confirm that every value is a non-negative whole number.

If datasets are combined, retain shared gene symbols, make sample IDs unique, and construct `group_as` in matrix-column order:

```r
tpm_metadata <- sample_metadata[
  match(colnames(tpm_matrix), sample_metadata$sample_id),
]
stopifnot(!anyNA(tpm_metadata$sample_id))

condition <- gsub("_", "-", tpm_metadata$model, fixed = TRUE)
group_as <- paste(condition, tpm_metadata$tissue, sep = "_")
stopifnot(length(group_as) == ncol(tpm_matrix))
```

For `plot_TME_boxplot()`, use exactly one underscore to separate the condition and tissue label, for example `Model-A_normal` and `Model-A_tumor`. Use hyphens within condition names.

### 5. Optional clinical and CNV annotations

Clinical and CNV annotations are optional additions to the TROM heatmap. The clinical `.tsv` file requires `PATIENT_ID` and a user-selected risk-factor column. The CNV `.tsv` file stores genes as row names and human samples as columns.

Prepare a CNV file that restores gene symbols as row names when read with `read.table()`. One reliable format is produced with:

```r
write.table(
  cnv_matrix,
  "data/cnv_for_murinematchtx.tsv",
  sep = "\t",
  quote = FALSE,
  col.names = NA
)
```

The requested CNV genes must occur in `rownames(cnv_matrix)`. Sample identifiers should use the same TCGA patient convention as the clinical file.

---

## Main functions

### 1. `merge_DEG_datasets()` — normalize and combine DEG results

#### Purpose

`merge_DEG_datasets()` reads one human DEG file and multiple mouse DEG files, normalizes method-specific columns, applies a shared threshold definition, and combines the results into one tidy data frame.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `human_file_path` | Required | Human DEG result file. |
| `mouse_files` | Required | Named list of mouse DEG file paths. |
| `logFC_value`, `FDR_value` | `1`, `0.05` | Compatibility thresholds used only when `deg_thresholds` is `NULL`. |
| `deg_method` | `"edgeR"` | `"edgeR"`, `"DESeq2"`, `"limma"`, or `"custom"`; may be named by dataset. |
| `lfc_col`, `padj_col`, `gene_col` | `NULL` | Explicit columns for custom or nonstandard inputs; may be scalar or named by dataset. |
| `deg_thresholds` | `NULL` | List containing `log2fc` and `fdr`. |

#### Example

```r
human_deg_file <- "data/human_deg.tsv"
mouse_deg_files <- list(
  Model_A = "data/model_a_deg.tsv",
  Model_B = "data/model_b_deg.tsv"
)

deg_thresholds <- list(log2fc = 1, fdr = 0.05)

merged_deg <- merge_DEG_datasets(
  human_file_path = human_deg_file,
  mouse_files = mouse_deg_files,
  deg_method = "edgeR",
  deg_thresholds = deg_thresholds
)

head(merged_deg)
attr(merged_deg, "deg_thresholds")
```

For custom tables that all use the same column names:

```r
merged_custom <- merge_DEG_datasets(
  human_file_path = "data/human_custom.tsv",
  mouse_files = list(Model_A = "data/model_a_custom.tsv"),
  deg_method = "custom",
  lfc_col = "effect",
  padj_col = "q_value",
  gene_col = "gene_id",
  deg_thresholds = deg_thresholds
)
```

#### Output and interpretation

The returned data frame contains `gene`, `logFC`, `FDR`, `contrast`, and `change`. The validated threshold object is stored in the `deg_thresholds` attribute. Use this object for cross-dataset visualization under one prespecified DEG definition.

---

### 2. `plot_DEG_volcano()` — visualize DEG distributions by dataset

#### Purpose

`plot_DEG_volcano()` plots each gene by dataset and log2 fold change. Color represents the `Up`, `Down`, or `Stable` classification, while point size and transparency reflect `-log10(FDR)`.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `deg_data` | Required | Output from `merge_DEG_datasets()`. |
| `title` | `"Volcano Plot of DEG Analysis"` | Plot title. |
| `xlab`, `ylab` | `"Group"`, `"Log2 Fold Change"` | Axis labels. |
| `colors` | Named list | Colors for `Up`, `Down`, and `Stable`. |
| `point_size` | `2` | Reserved by the current interface; plotted size is mapped to `-log10(FDR)`. |
| `alpha_range` | `c(0.3, 1)` | Transparency range. |
| `x_angle` | `45` | X-axis label angle. |
| `legend_position` | `"right"` | ggplot2 legend position. |
| `width`, `height` | `10`, `6` | PDF dimensions in inches. |
| `output_path` | `"./DEG/"` | Output directory prefix; include a trailing separator. |
| `deg_thresholds` | `NULL` | Optional explicit threshold object; otherwise inherited from `deg_data`. |

#### Example

```r
deg_output <- paste0(file.path("results", "DEG"), .Platform$file.sep)
dir.create(deg_output, recursive = TRUE, showWarnings = FALSE)

volcano_plot <- plot_DEG_volcano(
  deg_data = merged_deg,
  title = "Human and mouse tumor-versus-normal DEG profiles",
  output_path = deg_output
)

volcano_plot
```

#### Output and interpretation

The function returns a ggplot object and writes `volcano_plot.pdf`. The figure compares dataset-level DEG distributions under the same thresholds. Use the directional-concordance and TROM modules for their respective cross-species endpoints.

---

### 3. `prepare_DEG_heatmap_data()` — align significant DEGs through an audited ortholog map

#### Purpose

`prepare_DEG_heatmap_data()` normalizes DEG inputs, applies one threshold object, audits the ortholog table, and aligns significant human genes with mouse orthologs. It records gene loss at each selection step.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `tcga_file` | Required | Human DEG result file. |
| `mouse_files` | Required | Named list of mouse DEG result files. |
| `logFC`, `FDR` | `1`, `0.05` | Compatibility thresholds used only when `deg_thresholds` is `NULL`. |
| `inTax`, `outTax` | `9606`, `10090` | Taxonomy IDs for the HomoloGene compatibility path. |
| `deg_method` | `"edgeR"` | DEG input format; may be named by dataset. |
| `lfc_col`, `padj_col`, `gene_col` | `NULL` | Explicit input columns. |
| `deg_thresholds` | `NULL` | Shared `log2fc` and `fdr` values. |
| `ortholog_map` | `NULL` | Required mapping table for the primary Compara path. |
| `mapping_source` | `c("compara", "homologene")` | Primary audited mapping or explicit compatibility analysis. |

#### Example

```r
prepared_deg <- prepare_DEG_heatmap_data(
  tcga_file = human_deg_file,
  mouse_files = mouse_deg_files,
  deg_method = "edgeR",
  deg_thresholds = deg_thresholds,
  ortholog_map = ortholog_map,
  mapping_source = "compara"
)

prepared_deg$mapping_audit
prepared_deg$gene_loss_audit
```

#### Output and interpretation

The returned list contains:

| Component | Description |
| :-- | :-- |
| `processed_tcga` | Significant human DEG values retained after mapping. |
| `processed_mouse` | Per-model directional concordance values and adjusted p-values. |
| `tcga_gene_list` | Retained human stable gene IDs. |
| `mapping_audit` | Stepwise mapping audit. |
| `gene_loss_audit` | Per-dataset loss and retention counts. |
| `ortholog_map` | Retained high-confidence one-to-one mapping. |
| `deg_thresholds` | Thresholds used in the analysis. |

For each mouse model, `1` denotes a significant upregulated gene in both species, `-1` denotes a significant downregulated gene in both species, and `NA` denotes an absent, stable, or directionally discordant mouse result. Review both audit tables before interpreting model differences.

---

### 4. `plot_DEG_heatmap()` — display directional DEG concordance

#### Purpose

`plot_DEG_heatmap()` converts the prepared DEG object into a model-by-gene matrix and writes a binary heatmap.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `deg_data` | Required | Output from `prepare_DEG_heatmap_data()`. |
| `mouse_files` | Required | Original named mouse-file list; names define default columns. |
| `col_names` | `NULL` | Optional display names with one value per model. |
| `cluster_rows`, `cluster_cols` | `FALSE`, `FALSE` | Row and column clustering options. |
| `color_palette` | Named vector | Colors for `1`, `-1`, and `NA`. |
| `width`, `height` | `7.9`, `5.95` | PDF dimensions in inches. |
| `output_path` | `"./DEG/"` | Output directory prefix; include a trailing separator. |
| `deg_thresholds` | `NULL` | Optional explicit thresholds; otherwise inherited from `deg_data`. |

#### Example

```r
heatmap_data <- plot_DEG_heatmap(
  deg_data = prepared_deg,
  mouse_files = mouse_deg_files,
  output_path = deg_output
)
```

#### Output and interpretation

The function writes `heatmap.pdf` and returns the displayed matrix. The matrix carries the threshold object as an attribute and is the direct input to `plot_DEG_barplot()`. White cells combine three possible states—absent, stable, or discordant—so use `gene_loss_audit` and the source DEG tables when those distinctions matter.

---

### 5. `plot_DEG_barplot()` — count directionally concordant DEGs

#### Purpose

`plot_DEG_barplot()` counts the `1` and `-1` entries in the DEG heatmap matrix for each mouse model.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `heatmap_data` | Required | Matrix returned by `plot_DEG_heatmap()`. |
| `colors` | `list(up = "#ff7676", down = "#66d4ff")` | Bar colors. |
| `width`, `height` | `8`, `4` | PDF dimensions in inches. |
| `output_path` | `"./DEG/"` | Output directory prefix; include a trailing separator. |
| `deg_thresholds` | `NULL` | Optional explicit thresholds; otherwise inherited from `heatmap_data`. |

#### Example

```r
deg_barplot <- plot_DEG_barplot(
  heatmap_data = heatmap_data,
  output_path = deg_output
)

deg_barplot
```

#### Output and interpretation

The function returns a ggplot object and writes `barplot.pdf`. Bar height reports the number of mapped human DEGs with the same significant direction in each mouse model. Interpret counts together with the number of mapped and retained genes.

---

### 6. `prepare_PCA_data()` — merge expression matrices and attach sample metadata

#### Purpose

`prepare_PCA_data()` intersects genes across the human and mouse expression files, orders metadata by sample ID, and prepares uncorrected expression data for PCA and TROM. Optional ComBat correction is recorded separately.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `tcga_file` | Required | Human expression file containing an `X` gene-ID column. |
| `mouse_files` | Required | Named list of mouse expression files. |
| `sample_counts` | `NULL` | Deprecated positional compatibility input. |
| `batch_correction` | `FALSE` | Apply `sva::ComBat` and store a corrected matrix. |
| `sample_metadata` | `NULL` | Explicit metadata keyed by `sample_id`; recommended input. |

#### Example

```r
human_expression_file <- "data/human_expression.tsv"
mouse_expression_files <- list(
  Model_A = "data/model_a_expression.tsv",
  Model_B = "data/model_b_expression.tsv"
)

pca_data <- prepare_PCA_data(
  tcga_file = human_expression_file,
  mouse_files = mouse_expression_files,
  sample_metadata = sample_metadata,
  batch_correction = FALSE
)
```

Optional sensitivity analysis:

```r
pca_data_corrected <- prepare_PCA_data(
  tcga_file = human_expression_file,
  mouse_files = mouse_expression_files,
  sample_metadata = sample_metadata,
  batch_correction = TRUE
)
```

#### Output and interpretation

The returned list contains `merged_data`, `uncorrected_data`, `corrected_data`, `group_all`, `batch`, `parameters`, and metadata in matrix-column order. Use `uncorrected_data` for the primary PCA and TROM workflow. When species and dataset are completely confounded, ComBat may remove biological species differences; treat the corrected view as a sensitivity analysis under that design.

---

### 7. `plot_PCA_tinyarray()` — visualize global expression structure

#### Purpose

`plot_PCA_tinyarray()` draws PCA from the object returned by `prepare_PCA_data()`.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `pca_data` | Required | Output from `prepare_PCA_data()`. |
| `batch_correction` | `FALSE` | Use `corrected_data` when available. |
| `colors` | `NULL` | Optional vector with one color per group. |

#### Example

```r
pca_plot <- plot_PCA_tinyarray(
  pca_data = pca_data,
  batch_correction = FALSE
)

ggplot2::ggsave(
  file.path("results", "PCA_uncorrected.pdf"),
  plot = pca_plot,
  width = 8,
  height = 6
)
```

To inspect the optional corrected matrix:

```r
pca_plot_corrected <- plot_PCA_tinyarray(
  pca_data = pca_data_corrected,
  batch_correction = TRUE
)
```

#### Output and interpretation

The function returns the plot produced by `tinyarray::draw_pca()`. Use uncorrected PCA to inspect global structure, source separation, outliers, and potential confounding. Use a prespecified DEG or TROM endpoint for research-question-specific model prioritization.

---

### 8. `prepare_similarity_data()` — prepare optional clinical and CNV annotations

#### Purpose

`prepare_similarity_data()` extracts selected clinical risk factors and CNV genes for human samples. The returned table can annotate TROM heatmap rows.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `clinic_file` | Required | Tab-separated human clinical file containing `PATIENT_ID`. |
| `cnv_file` | Required | Tab-separated CNV matrix with genes as row names. |
| `clinical_vars` | Required | Text patterns to search in the risk-factor column. |
| `cnv_genes` | Required | CNV genes to extract. |
| `risk_factor_column` | Required | Clinical column containing risk-factor text. |

#### Example

```r
clinical_vars <- c("Risk factor A", "Risk factor B")
cnv_genes <- c("TP53", "PTEN")

clinical_cnv <- prepare_similarity_data(
  clinic_file = "data/human_clinical.tsv",
  cnv_file = "data/cnv_for_murinematchtx.tsv",
  clinical_vars = clinical_vars,
  cnv_genes = cnv_genes,
  risk_factor_column = "RISK_FACTOR_HISTORY"
)

# Heatmap annotations use explicit presence/absence labels.
for (variable in clinical_vars) {
  clinical_cnv[[variable]] <- ifelse(
    is.na(clinical_cnv[[variable]]),
    "Negative",
    "Positive"
  )
}
```

#### Output and interpretation

The returned data frame contains `PATIENT_ID`, one column per requested clinical pattern, and one factor column per requested CNV gene. Missing annotations are retained as `NA` while the corresponding human samples remain in the TROM calculation. Recode clinical-pattern columns to `Positive` and `Negative` before displaying them with `plot_TROMscore_heatmap()`.

---

### 9. `compute_similarity_matrix()` — calculate tissue-matched TROM scores

#### Purpose

`compute_similarity_matrix()` separates human and mouse samples through explicit metadata, calculates TROM scores, and records tissue-matched normal–normal and tumor–tumor comparisons.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `expression_matrix` | Required | Finite numeric gene-by-sample matrix. |
| `group_all`, `tcga_sample_size`, `tcga_normal_count` | `NULL` | Deprecated positional compatibility inputs. |
| `merge_clinic_CNV` | `NULL` | Optional table from `prepare_similarity_data()`. |
| `cnv_genes`, `clinical_vars` | `character()` | Annotation columns requested from the optional table. |
| `sample_metadata` | `NULL` | Explicit metadata shared with PCA; recommended input. |

#### Example without clinical or CNV annotations

```r
expression_matrix <- as.matrix(pca_data$uncorrected_data)
storage.mode(expression_matrix) <- "double"

trom_result <- compute_similarity_matrix(
  expression_matrix = expression_matrix,
  sample_metadata = pca_data$sample_metadata
)
```

Add annotations when they are available:

```r
trom_result_annotated <- compute_similarity_matrix(
  expression_matrix = expression_matrix,
  sample_metadata = pca_data$sample_metadata,
  merge_clinic_CNV = clinical_cnv,
  clinical_vars = clinical_vars,
  cnv_genes = cnv_genes
)
```

#### Output and interpretation

The returned list contains:

- `similarity_matrix`: raw human-by-mouse TROM matrix.
- `filtered_similarity_matrix`: matrix with cross-tissue comparisons set to `NA`.
- `dm_trom_del_backgroud_clinic`: human sample table with filtered scores and optional annotations.
- `sample_metadata`: validated metadata in expression-column order.

TROM scores describe relative sample-associated gene-set overlap under the supplied expression matrix, metadata, and TROM settings. Compare scores within the prespecified endpoint and evaluated datasets.

---

### 10. `plot_TROMscore_heatmap()` — display TROM scores and annotations

#### Purpose

`plot_TROMscore_heatmap()` aligns TROM scores and annotations by sample ID, retains tissue-matched comparisons, and writes a ComplexHeatmap PDF.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `dm_trom_del_backgroud_clinic` | Required | Annotated table from `compute_similarity_matrix()`. |
| `trom_matrix` | Required | Raw TROM matrix from `compute_similarity_matrix()`. |
| `clinical_vars`, `cnv_genes` | `character()` | Annotation columns to display. |
| `width`, `height` | `11.84`, `7.11` | PDF dimensions in inches. |
| `output_path` | `"./similarity/TROM_heatmap.pdf"` | Complete output filename. |
| `cluster_rows`, `cluster_cols` | `FALSE`, `FALSE` | Heatmap clustering options. |
| `sample_metadata` | `NULL` | Explicit metadata shared with PCA and TROM. |
| `tcga_sample_size`, `tcga_normal_count`, `model_group_count`, `condition`, `group_all` | `NULL` | Deprecated compatibility inputs used only without `sample_metadata`. |

#### Example

```r
trom_heatmap <- plot_TROMscore_heatmap(
  dm_trom_del_backgroud_clinic =
    trom_result$dm_trom_del_backgroud_clinic,
  trom_matrix = trom_result$similarity_matrix,
  sample_metadata = trom_result$sample_metadata,
  output_path = file.path("results", "TROM_heatmap.pdf")
)
```

With optional annotations, pass the same `clinical_vars` and `cnv_genes` used in `compute_similarity_matrix()`.

#### Output and interpretation

The returned list contains `heatmap_obj`, `merge_long`, and `plot_matrix`. The function omits mouse tissue groups absent from the human reference and retains the available tissue-matched branch. `merge_long` is the direct input to `plot_TROMscore_boxplot()`.

---

### 11. `plot_TROMscore_boxplot()` — summarize TROM score distributions by model

#### Purpose

`plot_TROMscore_boxplot()` combines a model-level score tile with tissue-specific TROM score distributions.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `merge_long` | Required | Long-format data returned by `plot_TROMscore_heatmap()`. |
| `output_path` | `"./similarity/TROM_boxplot"` | Output filename prefix; `.pdf` is appended. |
| `combine_plots` | `TRUE` | Return one combined plot or a list of tile and box plots. |

#### Example

```r
trom_summary <- plot_TROMscore_boxplot(
  merge_long = trom_heatmap$merge_long,
  output_path = file.path("results", "TROM_boxplot"),
  combine_plots = TRUE
)
```

#### Output and interpretation

The function writes a PDF and returns a combined patchwork object when `combine_plots = TRUE`; otherwise it returns the tile and box plots in a list. Use model-level means together with the underlying score distributions and the prespecified TROM endpoint.

---

### 12. `GO_enrichment_analysis()` — cluster enriched GO themes

#### Purpose

`GO_enrichment_analysis()` applies the shared DEG threshold definition, performs GO enrichment, calculates similarity among enriched GO terms, and writes a clustered similarity heatmap.

#### Input preparation

The `gene` values supplied to this function must be gene symbols supported by the selected organism annotation package. Convert Ensembl IDs before analysis when needed:

```r
deg_table <- read.delim("data/human_deg_ensembl.tsv", check.names = FALSE)

deg_table$gene <- unname(AnnotationDbi::mapIds(
  org.Hs.eg.db::org.Hs.eg.db,
  keys = sub("\\.[0-9]+$", "", deg_table$gene),
  keytype = "ENSEMBL",
  column = "SYMBOL",
  multiVals = "first"
))

deg_table <- deg_table[!is.na(deg_table$gene), ]
deg_table <- deg_table[order(deg_table$FDR), ]
deg_table <- deg_table[!duplicated(deg_table$gene), ]

write.table(
  deg_table,
  "data/human_deg_symbols.tsv",
  sep = "\t",
  row.names = FALSE,
  quote = FALSE
)
```

Use the corresponding `OrgDb` object for mouse or rat data.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `deg_file` | Required | DEG file containing organism-appropriate gene symbols. |
| `species` | Required | `"hsa"`, `"mmu"`, or `"rno"`. |
| `org_db` | Required | Matching annotation package name. |
| `ont` | `"BP"` | `"BP"`, `"MF"`, or `"CC"`. |
| `column_title` | Required | Plot title and PDF filename stem. |
| `width`, `height` | `10.36`, `6.35` | PDF dimensions in inches. |
| `output_path` | `"./enrichment"` | Output directory. |
| `deg_method` | `"edgeR"` | DEG input format. |
| `lfc_col`, `padj_col`, `gene_col` | `NULL` | Explicit input columns. |
| `deg_thresholds` | `NULL` | Shared `log2fc` and `fdr` values. |

#### Example

```r
library(org.Hs.eg.db)

GO_enrichment_analysis(
  deg_file = "data/human_deg_symbols.tsv",
  species = "hsa",
  org_db = "org.Hs.eg.db",
  ont = "BP",
  column_title = "Human_tumor_GO_BP",
  output_path = file.path("results", "GO"),
  deg_method = "edgeR",
  gene_col = "gene",
  deg_thresholds = deg_thresholds
)
```

#### Output and interpretation

The function writes `<column_title>.pdf`. At least two effective GO terms are required for the similarity analysis. The clustered terms summarize enriched themes under the selected DEG thresholds, gene identifiers, annotation resource, and ontology. Claims about pathway activity or model prioritization require the corresponding experimental evidence or prespecified module endpoint.

---

### 13. `plot_TME_barplot()` — estimate and visualize immune-cell composition

#### Purpose

`plot_TME_barplot()` validates a raw-count or TPM matrix, runs the selected IOBR deconvolution method, aggregates estimates by `group_as`, and writes a stacked bar plot and sample-level result table.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `data_matrix` | Required | Gene-by-sample raw-count or TPM matrix. |
| `input_type` | `"count"` | `"count"` or `"TPM"`. |
| `method` | Required | `"cibersort"`, `"mcpcounter"`, `"xcell"`, or `"quantiseq"`. |
| `group_as` | Required | Character vector in matrix-column order. |
| `output_path` | `"./TME"` | Output directory. |
| `height`, `width` | `5.2`, `10` | PDF dimensions in inches. |
| `input_source` | `NULL` | `"raw_count"`, `"provided_tpm"`, `"count2tpm"`, or a trusted source attribute. |

#### Example with prepared TPM

```r
tme_output <- file.path("results", "TME")

tme_result <- plot_TME_barplot(
  data_matrix = tpm_matrix,
  input_type = "TPM",
  input_source = "provided_tpm",
  method = "cibersort",
  group_as = group_as,
  output_path = tme_output
)
```

For a human raw-count matrix:

```r
tme_result_from_counts <- plot_TME_barplot(
  data_matrix = count_matrix,
  input_type = "count",
  input_source = "raw_count",
  method = "cibersort",
  group_as = group_as,
  output_path = tme_output
)
```

#### Output and interpretation

The returned list contains `eset_tpm`, `method_model`, and `input_metadata`. The function writes `<method>_cell_bar_plot.pdf` and `<method>_result.csv`. Results depend on the selected human-reference deconvolution method. For mouse samples, use them as exploratory immune descriptions and keep them separate from cross-species model-prioritization endpoints.

---

### 14. `calculate_metabolism_score()` — calculate metabolism-signature scores

#### Purpose

`calculate_metabolism_score()` calculates sample-level scores for the bundled metabolism signatures from a prepared TPM matrix.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `eset_tpm` | Required | TPM matrix with unique gene-symbol rows and sample-ID columns. |
| `method` | `"relative_zscore"` | `"relative_zscore"`, `"pca"`, `"ssgsea"`, `"zscore"`, or `"integration"`. |
| `mini_gene_count` | `1` | Minimum mapped genes required for a pathway score. |
| `input_source` | `NULL` | External TPM source; inherited from `plot_TME_barplot()` when available. |

#### Example

```r
metabolism_scores <- calculate_metabolism_score(
  eset_tpm = tme_result$eset_tpm,
  method = "relative_zscore",
  mini_gene_count = 1
)
```

For an external TPM matrix, declare its source:

```r
metabolism_scores <- calculate_metabolism_score(
  eset_tpm = tpm_matrix,
  method = "relative_zscore",
  mini_gene_count = 1,
  input_source = "provided_tpm"
)
```

#### Output and interpretation

The returned data frame contains `ID` followed by one column per bundled metabolism pathway. Attributes record the TPM source, scoring method, and mapped gene count for each pathway. `relative_zscore` requires at least two samples and scores each pathway relative to the supplied sample set. Compare scores generated with the same method, gene coverage, and input preparation.

---

### 15. `plot_metabolism_heatmap()` — visualize grouped metabolism scores

#### Purpose

`plot_metabolism_heatmap()` averages sample-level metabolism scores within each group, optionally scales each pathway across groups, clusters rows and columns, and writes a heatmap.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `sig_meta` | Required | Data frame from `calculate_metabolism_score()`. |
| `group_as` | Required | Character vector with one value per row of `sig_meta`. |
| `output_path` | `"./metabolism"` | Output directory. |
| `clustering_method` | `"pearson"` | `"pearson"`, `"manhattan"`, or `"canberra"`. |
| `scale_rows` | `TRUE` | Scale each pathway across groups before plotting. |
| `width`, `height` | `10`, `22` | PDF dimensions in inches. |
| `row_name_width` | `7` | Maximum row-name width in centimeters. |
| `right_padding` | `6` | Right plot padding in centimeters. |
| `row_height_pt` | `5` | Heatmap row height in points. |

#### Example

```r
metabolism_heatmap <- plot_metabolism_heatmap(
  sig_meta = metabolism_scores,
  group_as = group_as,
  output_path = file.path("results", "metabolism"),
  clustering_method = "pearson",
  scale_rows = TRUE,
  width = 12,
  height = 12
)
```

#### Output and interpretation

The function returns a ComplexHeatmap object and writes `heatmap.pdf`. With `scale_rows = TRUE`, colors show each pathway's relative pattern across the displayed groups rather than absolute differences between pathways. Results from current human-reference signatures provide exploratory metabolic descriptions and remain separate from model-prioritization endpoints.

---

### 16. `plot_TME_boxplot()` — display immune estimates by condition and tissue

#### Purpose

`plot_TME_boxplot()` runs CIBERSORT on a TPM matrix and writes one boxplot for each returned immune signature.

#### Main arguments

| Argument | Default | Description |
| :-- | :-- | :-- |
| `eset_tpm` | Required | TPM matrix returned by `plot_TME_barplot()` or another source-labelled TPM matrix. |
| `group_as` | Required | Labels in `condition_tissue` format and matrix-column order. |
| `condition_list` | Required | Named per-condition sample counts retained by the current interface. Plot grouping is derived from `group_as`. |
| `width`, `height` | `10`, `6` | PDF dimensions in inches. |
| `output_path` | `"./TME_boxplots"` | Output directory. |

#### Example

```r
condition_list <- as.list(
  table(sub("_(normal|tumor)$", "", group_as))
)

tme_boxplots <- plot_TME_boxplot(
  eset_tpm = tme_result$eset_tpm,
  group_as = group_as,
  condition_list = condition_list,
  output_path = file.path("results", "TME", "boxplots"),
  width = 8,
  height = 6
)
```

#### Output and interpretation

The function returns a named list of ggplot objects and writes one PDF per immune signature. The current implementation uses CIBERSORT. Compare distributions within the stated groups and deconvolution method; mouse estimates remain exploratory under the current human-reference signature.

---

## Output files

MurineMatchTx writes PDF figures and, where applicable, result tables to user-selected output paths:

1. DEG distribution plot, directional-concordance heatmap, and concordant-gene bar plot.
2. User-saved uncorrected and optional ComBat-corrected PCA plots.
3. TROM score heatmap and model-level summary plot.
4. GO term-similarity heatmap.
5. Immune-cell composition bar plot, sample-level table, and per-signature box plots.
6. Metabolism-score heatmap.

Keep the returned R objects, input metadata, threshold object, ortholog release, package versions, and output files together as the analysis record.

---

## Contributions and issues

Report reproducible problems or propose changes through the [MurineMatchTx issue tracker](https://github.com/wangdian-PKU/MurineMatchTx/issues).

---

## Contact

- **Authors:** Dian Wang and Guiwen Guan
- **Email:** wangdian@bjmu.edu.cn
- **GitHub:** [MurineMatchTx](https://github.com/wangdian-PKU/MurineMatchTx)
