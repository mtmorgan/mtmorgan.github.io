---
layout: post
title:  "R connections and C++ streams"
date:   2024-02-14
categories: software
---

I have been exploring flexibility and performance as part of the
[rjsoncons][] package for flexible JSON parsing. The package provides
an *R* interface to the [jsoncons][] library.

I want to support input from many different source -- files,
compressed files, URLs, etc. *R* provides support for these via it's
'connections' interface, `?connection`. On the other hand, jsoncons
like many C++ programs interfaces with iostreams.

The *C* interface to connections is not part of *R*'s public API, and
anyway the interface is in *C* rather than *C++*. My approach (1)
takes inspiration from the [readr][readr-readBin] package to invoke
the *R*-level `readBin()` from C++ using the [cpp11][] *R* package;
and (2) implements a streambuf subclass as outlined in a very helpful
StackOverflow [comment][SO-comment]. These actually come together
quite nicely.

## *R* script

At the *R* level, we'll open a connection for binary input, then
invoke a *C++* function that operates on the connection (the `2^22`
will be used to read binary data from the connection in chunks of
about 4 Mb), and finally close the connection.

```{r}
con <- gzfile("some_file.json", "wb")
result <- cpp_fun(con, 2^22)
close(con)
```

## *C++* class

For the *C++* code, start by including relevant header files

```{c++}
#include <streambuf>
#include <cpp11.hpp>
```

Create a `connectionbuf` subclass of `std::streambuf`

```{c++}
class connectionbuf : public std::streambuf {
```

Create a static inline C++ variable that represents the call to *R*'s
`base::readBin()`. We'll pass an S-expression representing the
connection constructed in *R* to our function, and store a reference
to this connection in the class.  We'll also create a buffer of
characters to store the result of `readBin()`, and a variable to store
the number of bytes read.

```{c++}
    inline static auto read_bin = cpp11::package("base")["readBin"];
    const cpp11::sexp& con_;
    char *buf_;
    int n_bytes_;
```

That's the end of the private details of the class. For the public
interface, create a constructor that initializes the connection SEXP
and number of bytes to read on each call to `readBin()`; allocate the
buffer to store results. The destructor frees the buffer.

```{c++}
  public:
    connectionbuf(const cpp11::sexp& con, const int n_bytes)
      : con_(con), n_bytes_(n_bytes)
        {
            buf_ = new char[n_bytes_];
        }

    ~connectionbuf() { delete this->buf_; }
```

Implementing a subclass of `std::streambuf` for an input stream
requires just a single function: `underflow()`, called whenever the
buffer is 'empty' and returning an integer that indicates either the
end-of-file or the value of the first character in the buffer. The
skeleton of this function is

```{c++}
    int underflow() {
        if (this->gptr() == this->egptr()) {
            // Populate buf_ with the results of a call to read_bin()
            // Tell the base class about the buffer
            this->setg(buf_, buf_, buf_ + chunk_len);
        }
        return this->gptr() == this->egptr() ?
            std::char_traits<char>::eof() :
            std::char_traits<char>::to_int_type(*this->gptr());
    }
```

The basic idea is to register (using `setg()`) with the base class
pointers to the start `eback()`, current `gptr()`, and end (`egptr()`
one-after-last) of the buffer maintained by `connectionbuf`. The
buffer is empty (needs refilling) when the current pointer is equal to
the end pointer, `gptr() == egptr()`.

Our implementation task is to invoke `readBin()`
to get another chunk of data for the buffer. This is implemented by
the additional lines of code

```{c++}
    int underflow() {
        if (this->gptr() == this->egptr()) {
            // invoke R's readBin() function, asking for up to n_bytes_
            SEXP chunk = read_bin(con_, "raw", n_bytes_);
            // copy the result from the SEXP into buf_, so we do not have
            // to worry about R's garbage collection
            R_xlen_t chunk_len = Rf_xlength(chunk);
            std::copy(RAW(chunk), RAW(chunk) + chunk_len, buf_);
            // update the streambuf pointers to our buffer
            this->setg(buf_, buf_, buf_ + chunk_len);
        }
    }
```

`setg()` sets the start and current pointers to the start of our
buffer, and the end-of-buffer pointer to one past the last byte we've
read. If `read_bin()` returns no values, then `chunk_len` is 0 and
`setg()` sets the current location `gptr()` to the end location
`egptr()`.

The return value of `underflow()` is either end-of-file (if even after
update the current and end pointers are the same) or the value pointed
to by the current pointer. The complete function is

```{c++}
    int underflow() {
        if (this->gptr() == this->egptr()) {
            SEXP chunk = read_bin(con_, "raw", n_bytes_);
            R_xlen_t chunk_len = Rf_xlength(chunk);
            std::copy(RAW(chunk), RAW(chunk) + chunk_len, buf_);
            this->setg(buf_, buf_, buf_ + chunk_len);
        }
        return this->gptr() == this->egptr() ?
            std::char_traits<char>::eof() :
            std::char_traits<char>::to_int_type(*this->gptr());
    }
};
```

Here's a complete header-only definition, e.g., 'connectionbuf.hpp'

```{c++}
#include <streambuf>
#include <cpp11.hpp>

class connectionbuf : public std::streambuf {
    inline static auto read_bin = cpp11::package("base")["readBin"];
    const cpp11::sexp& con_;
    char *buf_;
    int n_bytes_;

  public:

    connectionbuf(const cpp11::sexp& con, const int n_bytes)
      : con_(con), n_bytes_(n_bytes)
        {
            buf_ = new char[n_bytes_];
        }

    ~connectionbuf() { delete this->buf_; }

    int underflow() {
        if (this->gptr() == this->egptr()) {
            SEXP chunk = read_bin(con_, "raw", n_bytes_);
            R_xlen_t chunk_len = Rf_xlength(chunk);
            std::copy(RAW(chunk), RAW(chunk) + chunk_len, buf_);
            this->setg(buf_, buf_, buf_ + chunk_len);
        }
        return this->gptr() == this->egptr() ?
            std::char_traits<char>::eof() :
            std::char_traits<char>::to_int_type(*this->gptr());
    }
};
```

## *R* / *C++* interface

The remaining task is to use [cpp11][] to write an interface between
*R* and *C++*. We'll do this with a simple function that counts the
number of lines in a connection.

Start by including relevant headers -- iostream so that we can use our
buffer in an input stream, cpp11/declarations.hpp to so that the *C++*
function definition is exposed as an *R* function, and our
connectionbuf.hpp header file.

```{c++}
#include <iostream>
#include <cpp11/declarations.hpp>
#include "connectionbuf.h"
```

Create the interface to be exposed to *R*: a function taking a
connection and number of bytes to read, and returning the number of
lines in the connection.

```{c++}
[[cpp11::register]]
int cpp_fun(const cpp11::sexp& con, int n)
```

In the body of the function, instantiate our `connectionbuf` class,
and initialize an input stream that uses our connection buffer as its
source of input.

```{c++}
{
    connectionbuf cbuf(con, n);
    std::istream in(&cbuf);
```

To count lines, we'll create a `std::string` variable to record each
line, and an integer counter.

```{c++}
    std::string line;
    int i = 0;
```

The counting loop uses `std::getline()` to read a single line from the
input stream (which in turn reads data from the buffer and
`read_bin()`).

```{c++}
    while (std::getline(in, line)) {
        i += 1;
    }
```

The loop continues until there are no more lines available. Return the
count.

```{c++}
    return i;
}
```

The full implementation is

```{c++}
#include <iostream>
#include <cpp11/declarations.hpp>
#include "connectionbuf.h"

[[cpp11::register]]
int cpp_fun(const cpp11::sexp& con, int n)
{
    connectionbuf cbuf(con, n);
    std::istream in(&cbuf);
    std::string line;
    int i = 0;
    while (std::getline(in, line)) {
        i += 1;
    }
    return i;
}
```

## Use

In *R*, compile the function

```{r}
cpp11::cpp_source("cpp_fun.cpp")
```

And then use it, verifying that it is correct via base *R* methods
(the buffer size, 100, is small, so that `underflow()` is invoked at
least 4 times; a much larger buffer, e.g., 2^22, is appropriate for
real-world applications).

```{r}
> url = "https://bioconductor.org/config.yaml"
> length(readLines(url))
[1] 355
> con = url(url, "rb"); cpp_fun(con, 100); close(con)
[1] 355
```

[rjsoncons]: https://mtmorgan.github.io/rjsoncons
[jsoncons]: https://danielaparker.github.io/jsoncons/
[readr-readBin]: https://github.com/tidyverse/readr/blob/main/src/connection.cpp
[cpp11]: https://CRAN.R-project.org/package=cpp11
[SO-comment]: https://stackoverflow.com/a/14086442/547331
