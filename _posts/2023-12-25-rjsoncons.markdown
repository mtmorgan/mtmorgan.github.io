---
layout: post
title:  "rjsoncons for JSON manipulation"
date:   2024-01-01 09:57:26 -0500
categories: software update
---

Original publication: 14 December, 2023

[https://mtmorgan.github.io/rjsoncons/][rjsoncons]

The 'rjsoncons' [CRAN][rjsoncons-cran] package wraps the [jsoncons][]
C++ library for querying and manipulating JSON objects. The package
implements `jmsepath()`, `jsonpath()` and `jsonpointer()`to the
user. The package implements an internal parser from JSON to *R*. The
package exposes the header-only jsoncons library, so other developers
can leverage this library to expose additional functionality in *R*. I
used development of this package as an opportunity to the 'cpp11' *R*
package interface to C++.

Version 1.1.0 updated the jsoncons library. 

The current 'devel' version:

- Implements `j_query()` to auto-detect query syntax (JSONpointer,
  JSONpath, JMESpath).
- Implement `j_pivot()` to pivot a JSON array-of-objects to R-friendly
  object-of-arrays, with optional import as a `data.frame` or
  `tibble`. This was named `jsonpivot()` in an earlier development
  version.
- Implements `jsonpointer()` for extracting elements using JSON
  Pointer.
- Updates the jsoncons library to 0.173.2 to avoid dependency on C++ 14.

[rjsoncons]: https://mtmorgan.github.io/rjsoncons/
[rjsoncons-cran]: https://cran.R-project.org/package=rjsoncons
[jsoncons]: https://danielaparker.github.io/jsoncons
