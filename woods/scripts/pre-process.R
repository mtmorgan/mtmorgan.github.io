library(dplyr)

img_path <- "~/a/git/mtmorgan.github.io/woods/images"
json_path <- file.path(dirname(img_path), "woods.json")
imgs <- dir(img_path, pattern = "IMG*", full.names = TRUE)

##
## Extract exif information from images, calculate elapsed and start
## times, write to 'woods.json'
##

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
        Index = row_number(),
        ElapsedTime = as.integer(c(
            tail(CreateDate, -1) - head(CreateDate, -1),
            (tail(CreateDate, 1) - head(CreateDate, 1)) / (n() - 1)
        )),
        StartTime = cumsum(c(0, head(ElapsedTime, -1)))
    )

## all are 240 x 320 pixels, 72 pixels per inch
img_tbl |>
    select(ImageWidth, ImageHeight, XResolution) |>
    distinct()

## write to JSON
img_tbl |>
    select(Index, FileName, StartTime, ElapsedTime) |>
    jsonlite::write_json(json_path)

##
## Create GPS track from second set of photos
##

img_path <- path.expand("~/a/git/mtmorgan.github.io/woods/images-another")
json_path <- file.path(dirname(img_path), "woods.json")
imgs <- dir(img_path, pattern = "IMG*", full.names = TRUE)

## Extract / visualize as plot
tbl <-
    exiftoolr::exif_read(
        imgs,
        tags = c(
            "FileName", "CreateDate",
            "ImageWidth", "ImageHeight", "XResolution",
            "ImageDescription", "GPSLatitude", "GPSLongitude"
        )
    ) |>
    unclass() |>
    as_tibble() |>
    mutate(CreateDate = as.POSIXct(CreateDate, format = "%Y:%m:%d %H:%M:%S")) |>
    arrange(CreateDate) |>
    mutate(ImageDescription = trimws(ImageDescription)) |>
    tidyr::fill(ImageDescription, .direction = "down") |>
    filter(!duplicated(ImageDescription))

## Exploratory output / visualization
tbl |> print(n = Inf)

plot(GPSLatitude ~ GPSLongitude, tbl, type = "b", pch = "")
with(tbl, text(GPSLongitude, GPSLatitude, ImageDescription))

## Create GPX file
## https://exiftool.org/geotag.html#Inverse
## https://www.topografix.com/gpx/1/1/
gpx_fmt <- "/Users/mtmorgan/a/git/mtmorgan.github.io/woods/scripts/gpx.fmt"
gpx_file <- file.path(dirname(img_path), "another.gpx")
exiftoolr::exif_call(
               args = c("-fileOrder", "createdate", "-p", gpx_fmt, img_path),
               stdout = gpx_file
           )
