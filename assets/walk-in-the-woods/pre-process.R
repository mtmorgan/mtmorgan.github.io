library(dplyr)

img_path <- "~/a/git/mtmorgan.github.io/assets/walk-in-the-woods/"
json_path <- file.path(img_path, "woods.json")
imgs <- dir(img_path, pattern = "IMG*", full.names = TRUE)

tbl <-
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
tbl |>
    select(ImageWidth, ImageHeight, XResolution) |>
    distinct()

tbl |>
    select(FileName, CreateDate, StartTime, ElapsedTime) |>
    jsonlite::write_json(json_path)
