---
layout: post
title:  "The cellxgenedp and hca packages"
date:   2023-10-30 09:57:26 -0500
categories: software update
---

[cellxgenedp][] ([Bioconductor][cellxgenedp-bioc]) enables discovery
and download of [CELLxGENE][] resources for single-cell transcriptome
data. The hca package ([Bioconductor][hca-bioc]) provides a similar
interface to Human Cell Atlas data resources.

A recent update addressed changes to the API exposed by CELLxGENE;
previous versions of the package will stop working when the previous
API is removed.

[cellxgenedp]: https://mtmorgan.github.io/cellxgenedp/
[cellxgenedp-bioc]: https://bioconductor.org/packages/cellxgenedp
[CELLxGENE]: https://cellxgene.cziscience.com/
[hca-bioc]: https://bioconductor.org/packages/hca
