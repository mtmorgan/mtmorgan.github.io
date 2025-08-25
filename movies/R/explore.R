setwd("~/a/git/mtmorgan.github.io/movies/R/")
library(RSQLite)
library(dplyr)

## relative to directory containing this R file
db_file <- file.path("..", "assets", "movies.db")
stopifnot(file.exists(db_file))
con <- dbConnect(SQLite(), db_file)

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
