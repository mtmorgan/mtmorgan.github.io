---
layout: post
title:  "Improving NDJSON performance"
date:   2024-01-25
categories: software update
---

<https://mtmorgan.github.io/rjsoncons>


Some of my work this week was on improving the performance of NDJSON
parsing in [rjsoncons][]. NDJSON is a JSON format where each line
represents a complete JSON record, corresponding approximately to
a row in a table. My inspiration came from a DuckDB blog post on
'[Shredding Deeply Nested JSON, One Vector at a Time][duckdb]'. The
example data is from [GH Archive][], a project to record activity on
public GitHub repositories. I use a single file, with one hour of
data.

``` r
ndjson_file <- "data/gharchive_gz/2023-02-08-0.json.gz"
download.file(
    "https://data.gharchive.org/2023-02-08-0.json.gz",
    ndjson_file
)
```

We can view a single record interactively, using [rjsoncons][] and
[listviewer][].

```{r}
j_query(ndjson_file, n_records = 1) |>
    listviewer::jsonedit()
```

Here is one record; structure and content of individual records can vary.

```
{
  "id": "26939254345",
  "type": "DeleteEvent",
  "actor": {
    "id": 19908762,
    "login": "lucianHymer",
    "display_login": "lucianHymer",
    "gravatar_id": "",
    "url": "https://api.github.com/users/lucianHymer",
    "avatar_url": "https://avatars.githubusercontent.com/u/19908762?"
  },
  "repo": {
    "id": 469847426,
    "name": "gitcoinco/passport",
    "url": "https://api.github.com/repos/gitcoinco/passport"
  },
  "payload": {
    "ref": "format-alert-messages",
    "ref_type": "branch",
    "pusher_type": "user"
  },
  "public": true,
  "created_at": "2023-02-08T00:00:00Z",
  "org": {
    "id": 30044474,
    "login": "gitcoinco",
    "gravatar_id": "",
    "url": "https://api.github.com/orgs/gitcoinco",
    "avatar_url": "https://avatars.githubusercontent.com/u/30044474?"
  }
}
```

One use for [rjsoncons][] is to query JSON, rather than to process the
entire data, and to represent the result in a convenient way in
*R*. So one might extract the `"id"` and `"type"` fields as a tibble
with

``` r
j_pivot(ndjson_file, '{id: id, type: type}', as = "tibble", n_records = 5)
## # A tibble: 5 × 2
##   id          type
##   <chr>       <chr>
## 1 26939254345 DeleteEvent
## 2 26939254358 PushEvent
## 3 26939254361 CreateEvent
## 4 26939254365 CreateEvent
## 5 26939254366 PushEvent
```

But of course one would like to do this for the entire file.

[GH Archive]: https://www.gharchive.org/
[listviewer]: https://CRAN.R-project.org/package=listviewer

## Alternatives / the competition

### DuckDB

DuckDB shows some pretty amazing JSON parsing abilities,
including the '[GitHub Archive Examples][github]'.

[duckdb]: https://duckdb.org/2023/03/03/json.html
[github]: https://duckdb.org/2023/03/03/json.html#github-archive-examples

``` r
library(glue)
library(duckdb)
library(DBI)

con <- dbConnect(duckdb())
dbExecute(con, "INSTALL 'json';")
dbExecute(con, "LOAD 'json';")

sql <- glue(
    "SELECT id, type
     FROM read_ndjson_auto('{ndjson_file}');"
)
```

The performance is killer, and sets the bar to which we aspire.

``` r
system.time({
    res <- dbGetQuery(con, sql)
}) # 3.7 seconds!
```

`res` is an *R* `data.frame` with 172049 rows.

The `SELECT` statement is very flexible, allowing e.g., extraction of
arbitrarily nested data.

### jq

Probably most command-line JSON people use [jq][] for transforming
JSON. This shows that it takes about 0.62s to decompress the file

``` sh
$ time gzcat data/gharchive_gz/2023-02-08-0.json.gz > /dev/null
0.59s user 0.02s system 97% cpu 0.623 total
```

And another 8.3s to transform the JSON

``` sh
$ gzcat data/gharchive_gz/2023-02-08-0.json.gz | \
  time jq --compact-output '{id, type}' > /dev/null
8.20s user 0.06s system 99% cpu 8.303 total
```

Not as fast as DuckDB (though the query language of jq is much
richer), and not yet in *R*.

Adding steps to transforrm the result to *R* using [rjsoncons][]
increases the time but not too much; the code uses an *R* `pipe()` to
evaluate the system command, and then forwards the result (a character
vector) to `rjsoncons::j_pivot()`. This takes about 11.8s.

``` r
system.time({
    res <-
        readLines(pipe(
            "gzcat data/gharchive_gz/2023-02-08-0.json.gz | \
             jq --compact-output '{id, type}'")
        ) |>
        j_pivot(as = "tibble")
}) # 11.8s
```

This is quite a flexible solution, but does require the command line
tools `gzcat` and `jq`.

[jq]: https://jqlang.github.io/jq/

### The [ndjson][] *R* package

[ndjson][] advertises itself as "'Wicked-Fast Streaming 'JSON'
('ndjson') Reader". Performance was not compelling.

``` r
> system.time(df <- ndjson::stream_in(ndjson_file))
   user  system elapsed
583.550  12.727 604.492
> dim(df)
[1] 172049   7738
```

Note that one cannot filter the data, so all of it is read into
*R*.

The [ndjson github page][ndjson-github] implies better performance. It
might be that the complexity of the sample NDJSON file used here is
problematic. Also, the data is input to a `data.table`, and on my
machine (`aarch64-apple-darwin23.2.0`) I know that `data.table`
requires special steps to exploit multiple cores; I have not taken
those steps so this is single-core performance. 

The ndjson github page suggests much better performance on a 100,000
record file with simpler structure, but the description of the source
of the file was not sufficient for me to easily reconstruct it.

 The large number of columns recognized by `ndjson` (7738) suggests
 another possible performance hit: the JSON records are fully
 'flattened', and the large number of columns does not really make
 sense in the context of the GH Archive data.

[ndjson]: https://CRAN.R-project.org/package=ndjson
[ndjson-github]: https://github.com/hrbrmstr/ndjson

## Performance in [rjsoncons][]

My starting point with [rjsoncons][] (version 1.1.0.9400) was not too
promising:

``` r
> system.time(j_pivot(ndjson_file, '{id: id, type: type}',as = "tibble"))
   user  system elapsed
 78.538   0.574  79.435
```

Better than `ndjson`, but 20 times (!) slower than DuckDB.

### Original implementation

I want to use *R*'s connections like `gzfile()`, `url()`, etc., so
that I don't have to re-invent the data input step and so that I have
flexibility (e.g., to read from `https://`, or indeed a `pipe` like
the [jq][] example above). So the basic strategy is to read data at the
*R* level, then pass to jsoncons for process in C++.

My use cases mean that the output data (records of `{"id": id, "type":
type}`) is much smaller than the input data. So to manage memory I
chose to iterate through the input in chunks. The basic strategy is

``` r
## set up C++ data structures, then...
con <- gzfile(ndjson_file, "rb")
repeat {
    lines <- readLines(con, chunk_size)
    if (length(lines) == 0)
        break
    ## process 'lines' at the C++ level
}
## retrieve final data from C++
```

This shows two distinct parts to the code: (1) *R* data input; and (2)
C++ data transformation.

### *R* data input

It takes almost 1/2 the total time just to read through the data,
doing nothing else

``` r
chunk_size <- 10000
system.time({
    con <- gzfile(ndjson_file, "rb")
    repeat {
        lines <- readLines(con, chunk_size)
        if (length(lines) == 0L)
            break
    }
    close(con)
})
##   user  system elapsed
## 33.871   0.082  34.077
```

I know that *R*'s handling of character vectors can be expensive, so I
tried reading the data using `readBin()`; the binary data can be
coerced to strings later, and in C++.

``` r
chunk_size <- 2^20
system.time({
    con <- gzfile(ndjson_file, "rb")
    repeat {
        lines <- readBin(con, raw(), chunk_size)
        if (length(lines) == 0L)
            break
        ## cpp_buffer(lines) # coerce RAW() to std::string; return size()
    }
    close(con)
})
##  user  system elapsed
## 0.814   0.079   0.899
```

Wow, that's less than 1 second to read the entire file! This is
comparable to the `gzcat` facility at the command line.

I modified the code to read the data as an *R* `raw` vector, passing
this to C++. In C++ I wrote a class to parse this into
newline-delimited records to be fed to jsoncons.

### C++ data transformation

To investigate costs of C++ data transformation, I wrote a simplifed
data input and parsing function callable from *R*. The code uses the
zlib compression library to directly read the data into C, and then
forwards to jsoncons for processing. The code, written for the
[cpp11][] *R* / C++ interface, looked something like this:

``` C++
[[cpp11::register]]
int cpp_test(std::string file_name)
{
    auto expr = jsoncons::jmespath::make_expression<jsoncons::json>(
        "{id: id, type: type}");
    char buffer[buffer_size];
    gzFile in_file = gzopen(file_name, "rb");

    int n_lines = 0;
    while (true) {
        const char *line = gzgets(in_file, buffer, buffer_size);
        if (line == nullptr)
            break;
        ++n_lines;                                  // 0.77s
        const auto p = jsoncons::json::parse(line); // 29.0s
        const auto q = expr.evaluate(p);            // 31.3s
    }

    gzclose(in_file);
    return n_lines;
}
```

The comments represent the execution times for reading the data
(0.77s), reading and parsing the data (29.0s), and reading, parsing,
and evaluating the JMESpath expression on the parsed data (31.3s).

This was very discouraging. It suggested that jsoncons was just too
slow to be competitive. So I prepared a stand-alone version of this
program, thinking about opening an issue on the jsoncons
repository. Here's the program, with updated timings.

``` C++
#include "jsoncons/json.hpp"
#include "jsoncons_ext/jmespath/jmespath.hpp"
#include <zlib.h>

const int buffer_size = 1048576; // 2^20

int main(int argc, char *argv[])
{
    auto expr = jsoncons::jmespath::make_expression<jsoncons::json>(
        "{id: id, type: type}");
    char buffer[buffer_size];
    gzFile in_file = gzopen(argv[1], "rb");

    int n_lines = 0;
    while (true) {
        const char *line = gzgets(in_file, buffer, buffer_size);
        if (line == nullptr)
            break;
        ++n_lines;                                  // 0.78s
        const auto p = jsoncons::json::parse(line); // 7.01s
        const auto q = expr.evaluate(p);            // 7.94s
    }

    gzclose(in_file);

    std::cout << n_lines << std::endl;

    return 0;
}
```

Say what? the stand-alone program is about 5x faster than the *R* /
cpp11 code. This doesn't make real sense; the interface with *R* is
very light-weight (just passing a file path), and the C++ code is very
comparable. Somehow I managed to spot the problem...

When compiling the stand-along program, I used the `-O3` optimization
flag, because I wanted to maximize performance optimizations.

```
g++ -std=gnu++17 -lz -I. -O3 j_zlib.cpp
```

In *R* I create a file `~/.R/Makevars` that sets the same `-O3`
flag. I was using `devtools::load_all()`, and it generated the
following compilation commands (I wrapped the lines for easy reading)

``` R
> devtools::load_all()
...
-  installing *source* package 'rjsoncons' ... (637ms)
   ** using staged installation
   ** libs
   using C++ compiler: 'Apple clang version 15.0.0 (clang-1500.1.0.2.5)'
   using SDK: 'MacOSX14.2.sdk'
...
   g++ -std=gnu++17
       -I"/Users/ma38727/bin/R-devel/include" -DNDEBUG
       -I../inst/include/
       -I'/Users/ma38727/Library/R/arm64/4.4-3.19/cpp11/include'
       -I/opt/R/arm64/include    -fPIC
       -g -O3 -UNDEBUG -Wall -pedantic
       -g -O0 -fdiagnostics-color=always -c rjsoncons.cpp -o rjsoncons.o
...
```

Note that the `-O3` flag set in the Makevars file is present. But note
also the later `-O0` flag, telling the compiler to forget the `-O3`
flag, and do no optimization. Where did that `-O0` flag come from????

It turns out that `devtools::load_all()` compiles the DLL with
`pkgbuild::compile_dll()`, and this function has an argument `debug =
TRUE`. This inserts the `-O0` flag. Aargh.

The solution is not as easy as setting an argument `debug = FALSE` in
`devtools::load_all()` (there is no such argument). Instead, make sure
to start with just the source files, compile the DLL, and then load the package

``` r
pkgbuild::clean_dll()
pkgbuild::compile_dll(debug = FALSE) # no unexpected -O0 flag
devtools::load_all()
```

Finally, we're ready to benchmark our code

``` r
> system.time(res <- j_pivot(ndjson_file, '{id: id, type: type}', as = "tibble"))
   user  system elapsed
 12.597   0.199  12.835
```

This is comparable to the `jq` + *R* solution. It is about three times
slower than DuckDB, but still quite respectable. Using `verbose =
TRUE` adds a counter that makes it seem like the time goes by
faster...

[rjsoncons]: https://mtmorgan.github.io/rjsoncons

## Conclusions

This has been quite an interesting journey. 

The performance and flexibility of DuckDB is really amazing.

Even though there is a small performance hit, I still like my decision
to use *R* connections, giving robustness and flexibility for
different data sources. I learned quite a bit about *R*, especially
the heavy cost of working with character vectors; I wonder if I am
doing something not correct in using `readBin()` rather than
`readLines()`, maybe restricting myself to particular encodings?

The need to use `pkgbuild::compile_dll()` to have better control over
compilation was definitely a lesson learned.

A couple of things in cpp11 made me a little cautious, maybe in part
reflecting my comparative ignorance of C++. For instance, code like this

```
std::vector<uint8_t> foo(100);
cpp11::raws raw;
std::copy(foo.begin(), foo.end(), raw.begin())
```

lead to a segfault, because the iterator returned by `raw.begin()` did
not 'stop' at `raw.end()`, but rather continued to write data beyond
the end of the allocated array. Investigating this a little lead me to
an [issue][] suggesting that functions returning `writable` types
could leak memory. These two issues point to the underlying complexity
of cpp11, and it's relative newness in the *R* / C++ world.

[duckdb]: https://duckdb.org/2023/03/03/json.html
[github]: https://duckdb.org/2023/03/03/json.html#github-archive-examples
[gzstream]: https://www.cs.unc.edu/Research/compgeom/gzstream/
[cpp11]: https://cpp11.r-lib.org/
[issue]: https://github.com/r-dbi/RMariaDB/issues/309
