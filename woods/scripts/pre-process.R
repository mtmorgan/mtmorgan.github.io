library(dplyr)

img_path <- "~/a/git/mtmorgan.github.io/assets/walk-in-the-woods/small"
json_path <- file.path(img_path, "woods.json")
imgs <- dir(img_path, pattern = "IMG*", full.names = TRUE)

img_tbl <-
    exiftoolr::exif_read(
        imgs,
        tags = c(
            "FileName", "CreateDate", "ImageWidth", "ImageHeight", "XResolution"
        )
    ) |>
    unclass() |>
    as_tibble() |>
    select(FileName, CreateDate, ImageWidth, ImageHeight, XResolution) |>
    mutate(CreateDate = as.POSIXct(CreateDate, format = "%Y:%m:%d %H:%M:%S")) |>
    arrange(CreateDate) |>
    mutate(
        ElapsedTime = as.integer(c(
            tail(CreateDate, -1) - head(CreateDate, -1),
            (tail(CreateDate, 1) - head(CreateDate, 1)) / (n() - 1)
        )),
        StartTime = cumsum(c(0, head(ElapsedTime, -1)))
    )

## all are 3024 x 4032 pixels, 72 pixels per inch
img_tbl |>
    select(ImageWidth, ImageHeight, XResolution) |>
    distinct()

## find links to files
library(googledrive)

google_folder <- "walk-in-the-woods"
content <- drive_ls(google_folder, pattern = "IMG")

link_tbl <-
    content |>
    mutate(URL = drive_link(content)) |>
    select(name, URL)

tbl <- left_join(img_tbl, link_tbl, by = c(FileName = "name"))

glimpse(tbl)

tbl |>
    select(FileName, StartTime, ElapsedTime, URL) |>
    jsonlite::write_json(json_path)
