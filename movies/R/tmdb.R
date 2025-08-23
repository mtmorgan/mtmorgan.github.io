setwd("~/a/git/mtmorgan.github.io/movies/R/")
library(RSQLite)
library(dplyr)
requireNamespace("httr")
library(rjsoncons)

stopifnot(
    `missing environment variable 'TMDB_READ_ACCESS_TOKEN'` =
        nzchar(Sys.getenv("TMDB_READ_ACCESS_TOKEN"))
)

## relative to directory containing this R file
db_file <- file.path("..", "assets", "movies.db")
stopifnot(file.exists(db_file))
con <- dbConnect(SQLite(), db_file)
movie <- tbl(con, "movie") |> select(rank, title_text) |> collect()

movie <-
    movie |>
    mutate(
        ## title mismatches between NY Times ~ TMDb
        title_text = case_match(
            title_text,
            "Once Upon a Time ... in Hollywood" ~
                "Once Upon a Time... in Hollywood",
            "Tár" ~ toupper("Tár"),
            "The Gleaners & I" ~ "The Gleaners and I",
            "Ocean’s Eleven" ~ "Ocean\\'s Eleven",
            "Pan’s Labyrinth" ~ "Pan\\'s Labyrinth",
            "Wall-E" ~ "WALL·E",
            "Y tu mamá también" ~ "Y Tu Mamá También",
            .default = title_text
        )
    )

## wrap GET for reuse with bearer token, etc

get <-
    function(path, ...)
{
    base_url <- "https://api.themoviedb.org/3"
    bearer_token <- paste("Bearer", Sys.getenv("TMDB_READ_ACCESS_TOKEN"))
    url <- paste0(base_url, path)
    response <- httr::GET(
        url, ..., 
        httr::add_headers('Authorization' = bearer_token),
        httr::content_type("application/octet-stream"),
        httr::accept("application/json")
    )
    httr::content(response, as = "text")
}

## create tables for a single movie

tmdb_info <-
    function(rank, title, con)
{
    if (rank %% 10 == 0) message("rank: ", rank)
    tryCatch({
        movie <- get("/search/movie", query = list(query=title))

        movie_tbl <-
            j_query(movie, paste0("results[?title=='", title, "']")) |>
            j_pivot(
                "max_by([*], &popularity).{
                     tmdb_id: id, release_date: release_date,
                     overview: overview, popularity: popularity,
                     vote_average: vote_average, vote_count: vote_count
                 }",
                as = "tibble"
            )
        stopifnot(NROW(movie_tbl) == 1L)

        credits <- get(paste0("/movie/", movie_tbl$tmdb_id, "/credits"))

        crew_tbl <- j_pivot(
            credits,
            "crew[*].{
                tmdb_id: id, name: name, department: department, job: job
            }",
            as = "tibble"
        )

        cast_tbl <- j_pivot(
            credits,
            "cast[*].{
                tmdb_id: id, name: name, character: character, order: order
             }",
         as = "tibble"
        )
        stopifnot(
            NROW(crew_tbl) > 0,
            NCOL(crew_tbl) == 4,
            NROW(cast_tbl) > 0,
            NCOL(cast_tbl) == 4
        )
    }, error = function(err) {
        message(rank, " '", title, "' tmdb failed: ", conditionMessage(err))
    })

    tryCatch({
        dbWriteTable(
            con,
            "tmdb_movie", bind_cols(rank = rank, movie_tbl),
            append = TRUE
        )
        dbWriteTable(
            con,
            "tmdb_crew", bind_cols(rank = rank, crew_tbl),
            append = TRUE
        )
        dbWriteTable(
            con,
            "tmdb_cast", bind_cols(rank = rank, cast_tbl),
            append = TRUE
        )
    }, error = function(err) {
        message(rank, " '", title, "' sqlite failed: ", conditionMessage(err))
        FALSE
    })
}

## (re)create tables?

tbls <- c("tmdb_cast", "tmdb_crew", "tmdb_movie")
if (length(setdiff(tbls, dbListTables(con)))) {
    ## remove existing tables
    for (tbl in intersect(tbls, dbListTables(con)))
        dbRemoveTable(con, tbl)
    ## recreate all tables
    result <- Map(
        tmdb_info,
        pull(movie, "rank"), pull(movie, "title_text"),
        MoreArgs = list(con = con)
    )
}

##
## data exploration
##

## prolific directors...
tbl(con, "tmdb_crew") |>
    filter(job == "Director") |>
    count(name, sort = TRUE)
## ... and what they did
who <- "Christopher Nolan"
## who <- "Paul Thomas Anderson"
tbl(con, "tmdb_crew") |>
    filter(job == "Director", name == who) |>
    left_join(tbl(con, "movie")) |>
    select(rank, title_text) |>
    arrange(rank)

## prolific actors
tbl(con, "tmdb_cast") |>
    count(name, sort = TRUE) |>
    filter(n > 3) |>
    print(n = Inf)

tbl(con, "tmdb_cast") |>
    group_by(name) |>
    summarize(
        n = n(),
        mean_order = mean(order),
        median_order = median(order)
    ) |>
    filter(n > 2) |>
    arrange(median_order, desc(n)) |>
    print(n = 20)

## ...and what they did
## who <- "Brad Pitt"
who <- "Joseph Oliveira"
## who <- "Philip Seymour Hoffman"
## who <- "George Clooney"
## who <- "Sandra Hüller"
## who <- "Scarlett Johansson"
tbl(con, "tmdb_cast") |>
    filter(name == who) |>
    left_join(tbl(con, "movie")) |>
    select(rank, title_text, character, order) |>
    arrange(rank)

who <- "Caleb Landry Jones"
who <- "Joseph Oliveira"
tbl(con, "tmdb_cast") |>
    filter(name == who) |>
    arrange(rank)

## recency bias?
tbl(con, "tmdb_movie") |>
    mutate(release_date = as.Date(release_date)) |>
    collect() |>
    mutate(
        year = cut(
            release_date,
            breaks = 2000 + (0:6) * 5,
            right=FALSE
        )
    ) |>
    group_by(year) |>
    summarize(
        n = n(),
        mean_rank = mean(rank), median_rank = median(rank),
        min_rank = min(rank), max_rank = max(rank)
    )
