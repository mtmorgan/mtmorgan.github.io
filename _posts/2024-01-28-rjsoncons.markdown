---
layout: post
title:  "rjsoncons 1.2.0 CRAN released"
date:   2024-01-28
categories: software update
---

<https://mtmorgan.github.io/rjsoncons>

The [rjsoncons][] package has *R* functions to query (`j_query()`) and
import into *R* `data.frame`-like structures (`j_pivot()`) JSON and
NDJSON files. The package makes the 'jsoncons'
(<https://danielaparker.github.io/jsoncons/>) C++ library available to
other packages.

Version 1.2.0 introduces significant new capabilities.

- `j_query()` replaces `jmespath()`, `jsonpath()`, and
  `jsonpointer()`. `j_query()` looks at the format of `path` to deduce
  format.
- `j_pivot()` helps transform *Java*-centric 'array-of-objects' to
  *R*-friendly 'object-of-arrays' format.
- NDJSON (new-line delimited JSON) support; performance on queries is
  competitive with `jq` and other tools (see [this blog post][blog]
  for details).
- Support for *R* connections (e.g., `gzfile()`, `url()`).

[rjsoncons]: https://mtmorgan.github.io/rjsoncons
[blog]: https://mtmorgan.github.io/software/update/2024/01/25/rjsoncons-ndjson-performance.html
