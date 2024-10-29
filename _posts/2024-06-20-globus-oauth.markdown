---
layout: post
title:  "Globus OAuth workflow"
date:   2024-06-20
categories: software
---

**Update** 29 October, 2024: Christine Hou has developed [HuBMAPR][];
it is now available through [Bioconductor][]. Globus functionality is
in an unpublished GitHub package [rglobus][].

[HuBMAPR]: https://christinehou11.github.io/HuBMAPR
[Bioconductor]: https://bioconductor.org/packages/HuBMAPR
[rglobus]: https://mtmorgan.github.io/rglobus

I have been exploring updates to the very preliminary [HuBMAPR][]
package. Some [HuBMAP][] data is stored on [Globus][], and data access
requires authentication. This is not something I have implemented
before, or at least not in a more-or-less careful way.

[HuBMAP]: https://portal.hubmapconsortium.org/
[Globus]: https://app.globus.org

The solution I ended up with uses [httr2][], as well as [rjsoncons][]
and [dplyr][] for extracting and manipulating results.

[httr2]: https://httr2.r-lib.org/index.html
[dplyr]: https://dplyr.tidyverse.org/
[rjsoncons]: https://mtmorgan.github.io/rjsoncons

```{r}
library(httr2)
requireNamespace("rjsoncons")
requireNamespace("dplyr")
```

A key resource is the httr2 [OAuth][] vignette. I also made extensive
use of the [Globus Auth Developer Guide][] (especially section 1) and
eventually *Globus* documentation for the [`endpoint_search`][] API
endpoint.

[OAuth]: https://httr2.r-lib.org/articles/oauth.html
[Globus Auth Developer Guide]: https://docs.globus.org/api/auth/developer-guide
[`endpoint_search`]: https://docs.globus.org/api/transfer/endpoint_and_collection_search/#endpoint_search

## *Globus* & *R* clients

The httr2 [OAuth][] vignette indicates that I need to register a
'client' with *Globus*. Sounds intimidating, but actually it involves
filling in a simple web page as described in section [1.1][] of the
Globus Auth Developer Guide. 

The key steps in *Globus* are

- Create a 'thick' client
- Use `http://localhost/*` as the 'Redirects' field.
- Copy the client UUID for use in *R*

The *Globus* client can be updated / deleted / renamed / etc., by
visiting the 'Settings' portion of the [Globus][] web interface.

[1.1]: https://docs.globus.org/api/auth/developer-guide/#register-app

The *R* client is defined with the name and UUID from *Globus*. 

[1.2]: https://docs.globus.org/api/auth/developer-guide/#obtaining-authorization

```{r}
client <- oauth_client(
    id = "66ab38b0-4eb9-4751-a474-21f463b9881d",
    token_url = "https://auth.globus.org/v2/oauth2/token",
    name = "HuBMAPR"
)
```

The trickiest part is

- Defining `token_url`, which is the address from which the token will
  eventually be retrieved. It is mentioned in section [1.2] step 4 of
  the Globus Auth Developer Guide, a little out-of-sequence compared
  to the *R* steps.

Following httr2's [OAuth][] suggestion, I used
`oauth_flow_auth_code()` to work through how to obtain a token. The
end result involves defining a `redirect_uri` that *includes* a port;
I construct the URI as httr2 would.

```{r}
redirect_uri <- paste0(oauth_redirect_uri(), httpuv::randomPort())
```

The authentication token is then obtained with

```{r}
token <- oauth_flow_auth_code(
    client = client, 
    auth_url = "https://auth.globus.org/v2/oauth2/authorize",
    scope = paste(
        "urn:globus:auth:scope:transfer.api.globus.org:all",
        "offline_access"
    ),
    redirect_uri = redirect_uri
)
```

The token looks promising

```
> token
<httr2_token>
token_type: Bearer
access_token: <REDACTED>
expires_at: 2024-06-21 16:34:58
refresh_token: <REDACTED>
scope: urn:globus:auth:scope:transfer.api.globus.org:all
resource_server: transfer.api.globus.org
state: 31pHfPBl7RJ3mA1_EXJ5Ra1-RlJ6l-GnmlY_3dvCfdE
```

Key steps include:

- Defining `auth_url`, which is given in section [1.2][] step 1
- Defining `scope`, which I extracted from examples in section [1.2][]
  of the *Globus* guide. I'm not sure entirely whether `offline_access`
  is required for regular use; I believe it allows for the token to be
  refreshed if it expires.
- Pass an explicit `redirect_uri`.

Initially I had the `auth_url` incorrect, and *Globus* responded with a
404 'Service not available' error.

The most tricky part was the `redirect_uri`. `oauth_flow_auth_code()`
first invokes the `auth_url` in the user's browser, provindg a
callback address (i.e., the `redirect_uri`). If the user authenticates
correctly, the redirect URI recieves credentials that can be used to
retrieve a token via the *R* client's `token_url`. The `token_uri` is
then invoked with the requisite credentials, as well as `redirect_uri`
(I think as a way of validating that the same URI is being used both
during authentication and token request). The default httr2 flow uses
the redirect URI `oauth_redirect_uri()` *and port* when
authenticating, but only the `oauth_redirect_uri()` when requesting a
token. *Globus* complains with a 'Mismatching redirect URI' error, which
provided strong hints to the problem (once one understands the OAuth
workflow).

To figure out the redirect URI required inspecting the requests sent
by httr2, and this in turn required two different debugging
approaches. httr2 uses the base *R* function `browseURL()` to open a
browser for authentication. To see the URL opened by the browser, I
used

```{r}
trace(browseURL, quote(print(url)))
```

The token request uses httr2 internal functionality, and to see the
details of this transaction I used

```{r}
with_verbosity({
    token <- oauth_flow_auth_code(
        <...>
    )
}, 2)
```

Adding an explict `redirect_uri` including a port means that both
steps use the full URI.

The code so far shows that we can authenticate with *Globus* and
retrieve a token which, in principle, can be used to access data
requiring that we are authenticated.

## Accessing a *Globus* endpoint

As simple proof of concept, I wanted to be able to find all *Globus*
collections with 'HuBMAP' in their metadata. This can be accomplished
via the [Collection Search][] page on the *Globus* web site.

[Collection Search]: https://app.globus.org/file-manager/collections

A key step was to

- Determine the API endpoint being used

I used the Google Chrome developer tools available in the browser
(triple dot - More Tools - Develooper Tools) 'Network' tab to
understand what the web site was doing in response to the search
request. This lead me to the [`endpoint_search`][] API. 

The request I want to perform in *R* is

```{r}
req <-
    request("https://transfer.api.globus.org/v0.10/endpoint_search") |>
    req_url_query(
        filter_fulltext = "HuBMAP",
        filter_scope = "all",
        filter_non_functional = 0,
        offset = 0,
        limit = 100
    )
```

To this I add the authentication step, replacing
`oauth_flow_auth_code()` with `req_oauth_auth_code()` as instructed by
the httr2 [OAuth][] vignette, and perform the request

```{r}
response <-
    req |>
    req_oauth_auth_code(
        client = client, 
        auth_url = "https://auth.globus.org/v2/oauth2/authorize",
        scope = paste(
            "urn:globus:auth:scope:transfer.api.globus.org:all",
            "offline_access"
        ),
        redirect_uri = redirect_uri
    ) |>
    req_perform()
```

Miraculously, this seems to work

```
> response
<httr2_response>
GET
https://transfer.api.globus.org/v0.10/endpoint_search?filter_fulltext=HuBMAP&filter_scope=all&filter_non_functional=0&offset=0&limit=100
Status: 200 OK
Content-Type: application/json
Body: In memory (106374 bytes)
```

## From response to tibble
I explored the JSON result using

```{r}
response |>
    resp_body_string() |>
    listviewer::jsonedit()
```

I then coerced the repsonse to a tibble using `rjsoncons`

```{r}
tbl <-
    response |>
    resp_body_string() |>
    rjsoncons::j_pivot("DATA", as = "tibble")

## Alternative; maybe better column formatting
tbl1 <-
    response |>
    resp_body_string() |>
    rjsoncons::j_query("DATA") |>
    jsonlite::fromJSON(simplifyVector = TRUE) |>
    dplyr::as_tibble()
```

The result shows 34 collections mentioning 'HuBMAP'; I believe I am
interested in 'HuBMAP Public'...

```
> tbl
# A tibble: 34 × 76
   DATA_TYPE `_rank` acl_available acl_editable acl_max_expiration_p…¹ activated
   <chr>       <dbl> <lgl>         <lgl>        <list>                 <lgl>    
 1 endpoint    1.49  FALSE         FALSE        <NULL>                 FALSE    
 2 endpoint    1.49  FALSE         FALSE        <NULL>                 FALSE    
 3 endpoint    1.49  FALSE         FALSE        <NULL>                 FALSE    
 4 endpoint    1.49  FALSE         FALSE        <NULL>                 FALSE    
 5 endpoint    1.49  FALSE         FALSE        <NULL>                 FALSE    
 6 endpoint    0.486 TRUE          FALSE        <NULL>                 FALSE    
 7 endpoint    0.486 TRUE          FALSE        <NULL>                 FALSE    
 8 endpoint    0.486 TRUE          FALSE        <NULL>                 FALSE    
 9 endpoint    0.486 FALSE         FALSE        <NULL>                 FALSE    
10 endpoint    0.486 TRUE          FALSE        <NULL>                 FALSE    
# ℹ 24 more rows
# ℹ abbreviated name: ¹​acl_max_expiration_period_mins
# ℹ 70 more variables: authentication_assurance_timeout <list>,
#   authentication_policy_id <list>, authentication_timeout_mins <list>,
#   canonical_name <chr>, contact_email <list>, contact_info <list>,
#   default_directory <list>, department <list>, description <list>,
#   disable_anonymous_writes <lgl>, disable_verify <lgl>, display_name <chr>, …
# ℹ Use `print(n = ...)` to see more rows
```

## Directions

The use of a localhost redirect does not work on hosted platforms
(RStudio Connect; GitHub actions, etc) because ports are not generally
open. The httr2 manual page `?oauth_flow_auth_code` provides guidance
on making this more robust.

It will be interesting to explore paging through large result sets
using httr2.

The code above should obviously be abstracted to easily support
additional endpoints, and to simplify user requirements, e.g.,
encapsulating all of the above in a function invoked with something
like `search_collections("HuBMAP Public")`.
