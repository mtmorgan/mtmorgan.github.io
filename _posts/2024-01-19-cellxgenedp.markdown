---
layout: post
title:  "New 'Case Studies' vignette for cellxgenedp"
date:   2024-01-19
categories: software update
---

<https://mtmorgan.github.io/cellxgenedp>

A post on Chan-Zuckerberg slack channel `#cellxgene-users` inspired
some additional work on the [cellxgenedp][] package. The question was

> Hi! Is it possible to search CELLxGENE and identify all datasets by
> a specific author or set of authors?

The basic answer is straight-forward: join `authors()` and `datasets()`

```{r}
author_datasets <- left_join(
    authors(),
    datasets(),
    by = "collection_id",
    relationship = "many-to-many"
)
```

Elaborating on this inspired the [Case Studies][] vignette. The
initial question leads to several interesting avenues, e.g.,
identifying authors working in the same domain, or collaboration
networks (as explored a bit in [grantpubcite][]).

This case study is augemented in the vignette by a second case study,
or at least a pointer to [OLSr vignette][OLSr] on working with
CELLxGENE ontologies.

[cellxgenedp]: https://mtmorgan.github.io/cellxgenedp
[Case Studies]: https://mtmorgan.github.io/cellxgenedp/articles/b_case_studies.html
[grantpubcite]: https://mtmorgan.github.io/grantpubcite
[OLSr]: https://mtmorgan.github.io/OLSr/articles/b_case_study_cxg.html
