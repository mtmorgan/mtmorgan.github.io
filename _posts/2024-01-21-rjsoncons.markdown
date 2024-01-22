---
layout: post
title:  "Support for NDJSON in rjsoncons"
date:   2024-01-21
categories: software update
---

<https://mtmorgan.github.io/rjsoncons>

A DuckDB blog post on '[Shredding Deeply Nested JSON, One Vector at a
Time][duckdb]' shows some pretty amazing JSON parsing abilities,
including the '[GitHub Archive Examples][github]'. It inspired
exploration of NDJSON in rjsoncons, a first iteration of which is
available as version 1.1.0.9400.

```{r}
remotes::install_github("mtmorgan/rjsoncons")
```

Since NDJSON files can be large, one wants to iterate through these in
chunks. So in addition to NDJSON parsign, the package gains the
ability to read from connections (files or URLs). Support includes
both `j_query()` and `j_pivot()`. The `path` argument refers to
selection in individual records. So one might query a single record

```{r}
ndjson_file <- "data/gharchive_gz/2023-02-08-0.json.gz"
j_query(ndjson_file, n_records = 1) |> 
    listviewer::jsonedit()
```

Extract relevant infromation into a tibble

```{r}
result <- j_pivot(
    ndjson_file, 
    "{id: id, type: type}",   # path on individual records
    as = "tibble",            # output format
    verbose = TRUE            # progress bar
)
```

The result is a tibble that can be easily manipulated using dplyr.

```{r}
> result
# A tibble: 172,049 × 2
   id          type
   <chr>       <chr>
 1 26939254345 DeleteEvent
 2 26939254358 PushEvent
 3 26939254361 CreateEvent
 4 26939254365 CreateEvent
 5 26939254366 PushEvent
 6 26939254367 PushEvent
 7 26939254379 PushEvent
 8 26939254380 IssuesEvent
 9 26939254382 PushEvent
10 26939254383 PushEvent
# ℹ 172,039 more rows
# ℹ Use `print(n = ...)` to see more rows
```

Current performance is about 10x slower than DuckDB, but that is
for subsequent iterations.

## Some commentary

### Connections

I had hoped to use *R*'s connection interface at the C level, to avoid
realization of *R* data structures, but the public interface is just
too limited. 

I also explored implementing input using C++ iostreams, but wanted
support for compression. There seems to be a relatively old but
functional and light-weight [gzstream][] library. But this approach
actually didn't seem particularly performant (maybe there is a buffer
size that is too small?) and would not be as flexible as *R*-level
connections (e.g., handling `https://`).

At the R level, I currently chunk through connections using
`readLines()`. It is much faster to `readBin()`, avoiding the cost of
creating R character vectors.  One idea is to read raw vectors at the
R level, then pass to C++ for conversion to `std::string` and jsoncons
processing.

### External pointers

For chunk processing it makes sense to have C++ data structures that
persist across calls from *R*, so I created a C++ class `r_json` and
used [cpp11][]'s templated `external_pointer<>` class to return this
to *R*. `r_json` is templated

```{c++}
template<class Json>
r_json
{ ... }
```

so actually the cpp11 data structure is either `external_pointer<
r_json<json> >` or `external_pointer< rjson<ojson> >`. This leads to
the unfortunate situation where calls from *R* with the external
pointer also require the class, tempclass specification, and a
`switch()` for dispatch

```{c++}
template<class Json>
sexp do_something_impl(sexp extp)
{
    external_pointer< r_json<Json> > extp(ext);
    ...
}

sexp do_something(sexp ext, String template_class)
{
    switch(template_class) {
    case 'json': return do_something_impl<json>(ext);
    case 'ojson': return do_something_impl<ojson>(ext);
    }};
}
```

or similar. It is unfortunate that the template class information can
not be more tightly coupled with the external pointer, and that
dispatch is being re-invented with a `switch` statement. Maybe I am
not clever enough with C++...

[duckdb]: https://duckdb.org/2023/03/03/json.html
[github]: https://duckdb.org/2023/03/03/json.html#github-archive-examples
[gzstream]: https://www.cs.unc.edu/Research/compgeom/gzstream/
