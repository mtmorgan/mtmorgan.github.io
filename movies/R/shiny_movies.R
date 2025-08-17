library(shiny)
library(rvest)
library(dplyr)
library(DBI)
library(RSQLite)

## Load database and tables if not exist

db_file <- file.path("..", "assets", "movies.db")

## Create a (server-side) cache directory and memoize get_nytimes()

cache_directory <- tools::R_user_dir("shiny_movies", "cache")
if (!dir.exists(cache_directory))
  dir.create(cache_directory, recursive = TRUE)

get_nytimes_fun <- function(url) {
  destination <- file.path(cache_directory, "best-movies-21st-century.html")
  httr::GET(url, httr::write_disk(destination, overwrite = TRUE))
  destination
}

get_nytimes <- memoise::memoise(
  get_nytimes_fun,
  cache = memoise::cache_filesystem(cache_directory)
)

## Shiny user interface

ui <- fluidPage(
  titlePanel("New York Times Movies of the 21st Century"),
  sidebarLayout(
      sidebarPanel(
          DT::dataTableOutput("movies")
      ),
      mainPanel(
          uiOutput("synopsis"),
          checkboxInput("watched", "Watched", value = FALSE),
          checkboxInput("queued", "Queued", value = FALSE),
          textAreaInput(
              "notes", "Notes", value = "", 
              rows = 10, width = "100%", resize = "vertical"
          ),
          actionButton("update_notes", "Update")   # Add update button
      )
  )
)

## Shiny server logic

server <- function(input, output, session) {
  ## Read NYTimes page, possibly from cache

  nytimes_url <- paste0(
      "https://www.nytimes.com/interactive/2025/movies/",
      "best-movies-21st-century.html"
  )
  html_file <- get_nytimes(nytimes_url)
  best_movies_html <- read_html(html_file)

  con <- dbConnect(SQLite(), db_file)
  
  observeEvent(input$add_movie, {
      dbExecute(
          con,
          "INSERT INTO movie (title, year) VALUES (?, ?)",
          params = list(input$movie_title, input$movie_year)
      )
  })

  output$movies <- DT::renderDataTable({
      format_link <- function(url, text) {
          sprintf("<a href='%s' target='_blank'>%s</a>", url, text)
      }
      sql <- paste(
          "SELECT movie.*, notes.watched AS watched, notes.notes AS notes",
          "FROM movie",
          "LEFT JOIN notes ON movie.rank = notes.rank",
          "ORDER BY rank;"
      )
      movie <-
          dbGetQuery(con, sql) |>
          mutate(
              links = paste(
                  format_link(share_url, '&#128175'),
                  format_link(review_url, '&#128196;'),
                  ifelse(
                      !is.na(notes) & nzchar(notes),
                      '&#9989;',
                      ifelse(
                          !is.na(watched) & watched,
                          '&check;',
                          format_link(watch_url, '&#128065;')
                      )
                  )
              ),
              title = title_text
          ) |>
          select(`&nbsp;` = rank, Title = title, Links = links)
      DT::datatable(
          movie, 
          rownames = FALSE,
          escape = FALSE,
          selection = list(mode = "single"),
          options = list(
              paging = FALSE,
              scrollY = 400,
              scrollCollapse = TRUE,
              createdRow = DT::JS(
                  "function(row, data, dataIndex) { $('td', row).css('vertical-align', 'top'); }"
              )
          )
      )
  })

  selected_rank <- reactiveVal(NULL)

  observeEvent(input$movies_rows_selected, {
      is_checked <- function(x) {
          length(x) == 1L && x == 1L
      }
      idx <- input$movies_rows_selected
      if (!is.null(idx)) {

          ## Get selected movie title and rank
          movies <- dbGetQuery(
              con,
              "SELECT title_text, rank FROM movie ORDER BY rank"
          )
          rank <- movies$rank[idx]
          title <- movies$title[idx]
          selected_rank(rank)

          ## Display NY Times movie synopsis
          xpath <- sprintf(
              "//div[@id='movie-%d']/p[contains(@class, 'g-text')]",
              rank
          )
          synopsis <-
              best_movies_html |>
              html_element(xpath = xpath) |>
              html_text()
          output$synopsis <- renderUI({
              p(strong(title, .noWS = "after"), ":", synopsis)
          })

          ## Query notes table for checkboxes and notes
          note_row <- dbGetQuery(
              con, 
              "SELECT watched, queued, notes FROM notes WHERE rank = ?", 
              params = list(rank)
          )
          updateCheckboxInput(
              session, "watched", value = is_checked(note_row$watched)
          )
          updateCheckboxInput(
              session, "queued", value = is_checked(note_row$queued)
          )
          updateTextAreaInput(session, "notes", value = note_row$notes)
      }
  })

  ## Add observer to update notes table when button is clicked
  observeEvent(input$update_notes, {
      req(selected_rank())

      ## Check if row exists
      exists <- dbGetQuery(
          con, 
          "SELECT COUNT(*) as n FROM notes WHERE rank = ?", 
          params = list(selected_rank())
      )$n
      params <- list(
          as.integer(input$watched),
          as.integer(input$queued),
          input$notes,
          selected_rank()
      )
      if (exists > 0) {
          sql <- "UPDATE notes SET watched = ?, queued = ?, notes = ? WHERE rank = ?"
      } else {
          sql <- "INSERT INTO notes (watched, queued, notes, rank) VALUES (?, ?, ?, ?)"
      }
      dbExecute(con, sql, params = params)
  })

  session$onSessionEnded(function() {
      dbDisconnect(con)
  })
}

shinyApp(ui, server)
