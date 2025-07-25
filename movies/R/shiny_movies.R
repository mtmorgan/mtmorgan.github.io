library(shiny)
library(dplyr)
library(DBI)
library(RSQLite)

# Initialize database and tables if not exist
db_file <- file.path("..", "assets", "movies.db")
message(db_file)
con <- dbConnect(SQLite(), db_file)
message(paste(dbListTables(con), collapse = " "))
dbDisconnect(con)

ui <- fluidPage(
  titlePanel("New York Times Movies of the 21st Century"),
  sidebarLayout(
    sidebarPanel(
      DT::dataTableOutput("movies")
    ),
    mainPanel(
      checkboxInput("watched", "Watched", value = FALSE),
      checkboxInput("queued", "Queued", value = FALSE),
      textAreaInput(
        "notes", "Notes", value = "", 
        rows = 10, resize = "vertical"
        ),
      actionButton("update_notes", "Update")   # Add update button
    )
  )
)

server <- function(input, output, session) {
  con <- dbConnect(SQLite(), db_file)
  
  observeEvent(input$add_movie, {
    dbExecute(con, "INSERT INTO movie (title, year) VALUES (?, ?)", params = list(input$movie_title, input$movie_year))
  })

  output$movies <- DT::renderDataTable({
    format_link <- function(url, text) {
      sprintf("<a href='%s' target='_blank'>%s</a>", url, text)
    }
    movie <-
      dbGetQuery(con, "SELECT * FROM movie ORDER BY rank") |>
      mutate(
        links = paste(
          format_link(watch_url, '&#128065;'),
          format_link(review_url, '&#128196;')
        ),
        title = format_link(share_url, title_text)
      ) |>
      select(Rank = rank, Title = title, Links = links)
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
      movies <- dbGetQuery(con, "SELECT title_text, rank FROM movie ORDER BY rank")
      selected_rank(movies$rank[idx])

      # Query notes table for checkboxes and notes
      note_row <- dbGetQuery(
        con, 
        "SELECT watched, queued, notes FROM notes WHERE rank = ?", 
        params = list(movies$rank[idx])
      )
      updateCheckboxInput(session, "watched", value = is_checked(note_row$watched))
      updateCheckboxInput(session, "queued", value = is_checked(note_row$queued))
      updateTextAreaInput(session, "notes", value = note_row$notes)
    }
  })

  # Add observer to update notes table when button is clicked
  observeEvent(input$update_notes, {
    req(selected_rank())
    # Check if row exists
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