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

## wrap dbWriteTable

dbwrite <-
    function(con, name, value, rank)
{
    dbWriteTable(con, name, bind_cols(rank = rank, value), append = TRUE)
}

## denormalize genre ids

genre <- local({
    genre_lookup_tbl <-
        get("/genre/movie/list") |>
        j_pivot("genres", as = "tibble")

    function(movie) {
        id <- j_query(movie, "genre_ids", as = "R")
        if (!length(id)) # may be zero-length
            id <- integer()
        left_join(tibble(id), genre_lookup_tbl, by = "id") |>
            select(name)
    }
})

## create tables for a single movie

tmdb_info <-
    function(rank, title, con)
{
    if (rank %% 10 == 0) message("rank: ", rank)
    tryCatch({
        movie <-
            get("/search/movie", query = list(query=title)) |>
            j_query(paste0(
                "results[?title=='", title, "']", # exact title
                "| max_by([*], &popularity)"      # most popular
            ))

        movie_tbl <- j_pivot(
            movie,
            "{
                tmdb_id: id, release_date: release_date,
                overview: overview, popularity: popularity,
                vote_average: vote_average, vote_count: vote_count
            }",
            as = "tibble"
        )
        stopifnot(NROW(movie_tbl) == 1L)

        genre_tbl <- genre(movie)
        stopifnot(NCOL(genre_tbl) == 1L)

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
        dbwrite(con, "tmdb_movie", movie_tbl, rank)
        dbwrite(con, "tmdb_genre", genre_tbl, rank)
        dbwrite(con, "tmdb_crew", crew_tbl, rank)
        dbwrite(con, "tmdb_cast", cast_tbl, rank)
    }, error = function(err) {
        message(rank, " '", title, "' sqlite failed: ", conditionMessage(err))
        FALSE
    })
}

## (re)create tables?

tbls <- c("tmdb_cast", "tmdb_crew", "tmdb_movie", "tmdb_genre")
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
