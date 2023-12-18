---
layout: post
title:  "rjsoncons for JSON manipulation"
date:   2023-12-14 09:57:26 -0500
categories: software update
---

[https://mtmorgan.github.io/rjsoncons/][rjsoncons]

The 'rjsoncons' [CRAN][rjsoncons-cran] package wraps the [jsoncons][]
C++ library for querying and manipulating JSON objects. The package
exposes `jmsepath()` and `jsonpath()` to the user. The package
implements an internal parser from JSON to *R*. The package exposes
the header-only jsoncons library, so other developers can leverage
this library to expose additional functionality in *R*. I used
development of this package as an opportunity to the 'cpp11' *R*
package interface to C++.

Version 1.1.0 updated the jsoncons library. 1.1.0.9000 introduced
`jsonpivot()` for transforming JSON array-of-objects to an
object-of-arrays, making `data.frame` / `tibble` construction easier.

[rjsoncons]: https://mtmorgan.github.io/rjsoncons/
[rjsoncons-cran]: https://cran.R-project.org/package=rjsoncons
[jsoncons]: https://danielaparker.github.io/jsoncons
