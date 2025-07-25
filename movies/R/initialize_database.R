library(rvest)
library(dplyr)
datatable <- DT::datatable

## relative to directory containing this R file
db_file <- file.path("..", "assets", "movies.db")

## Scrape from NYtimes

url <- paste0(
    "https://www.nytimes.com/interactive/2025/movies/",
    "best-movies-21st-century.html"
)
html <- read_html(url)

html_value <- function(html, xpath) {
    html |>
        html_elements(xpath = xpath) |>
        html_text()
}

rank <- 
    html |>
    html_value("//p[@class='g-number svelte-1etx5n9']") |>
    as.integer()

title_text <-
    html |>
    html_value("//h2[@class='svelte-1etx5n9']")

share_url <-
    html |>
    html_value("//button[@class='click-to-copy svelte-z8gpi7']/@data-url")

review_url <-
    html |>
    html_value("//a[text() = 'Read our review']/@href")

watch_url <-
    html |>
    html_value("//a[@class='svelte-1etx5n9'][text() = 'here']/@href")

movies <- tibble(
    rank,
    title_text,
    share_url,
    review_url,
    watch_url
)

movies

## notes

queued <- integer()

watched <- c(
    1, 2, 4, 7, 9, 11, 13, 16, 21, 24, 25, 26, 27, 28
)

notes_rank <- unique(c(watched, queued))

notes <-  tibble(
    rank = notes_rank,
    watched = notes_rank %in% watched,
    queued = notes_rank %in% queued,
    notes = character(length(notes_rank))
)

## Write to SQLite

library(RSQLite)

con <- dbConnect(SQLite(), db_file)
if (!"movie" %in% dbListTables(con)) {
    dbWriteTable(con, "movie", movies)
}
if (!"notes" %in% dbListTables(con)) {
    dbWriteTable(con, "notes", notes)
}
dbDisconnect(con)

## Check

con <- dbConnect(SQLite(), db_file)

tbl(con, "movie") |>
    arrange(rank) |>
    dplyr::collect() |>
    dplyr::select(rank, title_text)

left_join(
    tbl(con, "notes") |> filter(watched == TRUE),
    tbl(con, "movie")
) |>
    arrange(rank) |>
    select(rank, queued, title_text, notes)

dbDisconnect(con)
