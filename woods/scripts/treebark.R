setwd('/Users/mtmorgan/a/git/mtmorgan.github.io/woods/scripts/')
stopifnot(
    require("dplyr"),
    require("httr2"),
    require("xml2"),
    requireNamespace("memoise"),
    requireNamespace("whisker")
)

memoise <- function(...) {
    cache_path <- tools::R_user_dir("woods", which = "cache")
    memoise::memoise(..., cache = cachem::cache_disk(cache_path))
}

get_html <- function(base_url, path) {
    url <- paste0(base_url, path)
    request(url) |>
        req_perform() |>
        resp_body_html()
}

get_trees <- memoise(function(base_url, path) {
    html <- get_html(base_url, path)
    query <- "//div[contains(@class, 'views-field-title')]//a/text()"
    species <- xml_find_all(html, query) |> as.character()

    query <- "//div[contains(@class, 'views-field-title')]//a"
    path <-
        xml_find_all(html, query)  |>
        xml_attr("href")

    tibble(species, path)
})

get_tree_info <- memoise(function(base_url, path) {
    message("Getting ", path)
    tree_html <- get_html(base_url, path)

    query <- "//h1//span/text()"
    species <-
        xml_find_first(tree_html, query) |>
        xml_text()

    query <- "//div[@class='intro__text']/div/p[1]/i"
    scientific_name <-
        xml_find_first(tree_html, query) |>
        xml_text()

    query <- "//div[@class='intro__text']/div/p[2]/a[3]/img"
    tree_img <- xml_find_all(tree_html, query)
    tree_img_alt <- xml_attr(tree_img, "alt")
    tree_img_src <- xml_attr(tree_img, "src")

    tibble(species, scientific_name, alt = tree_img_alt, src = tree_img_src)
})

## scrape data
base_url <- "https://www.ontario.ca"
tree_atlas <- get_trees(base_url, "/page/tree-atlas/ontario-southcentral")
tree_info <-
    lapply(pull(tree_atlas, path), get_tree_info, base_url = base_url) |>
    bind_rows()


## flag common taxa
common_six <- c(
    "American beech",
    "Balsam fir",
    "Eastern hemlock",
    ## "Eastern redcedar",
    "Eastern white cedar",
    "Red maple",
    "Red pine"
)
trees <-
    left_join(tree_atlas, tree_info, by = "species") |>
    mutate(common_six = species %in% common_six) |>
    bind_cols(base_url = base_url)

template <- '{{#taxa}}<figure>
  <a href="{{base_url}}{{path}}">
    <img alt="{{alt}}" src="{{src}}" loading="lazy"/>
  </a>
  <figcaption>
    <a href="{{base_url}}{{path}}">{{species}}</a>
  </figcaption>
</figure>
{{/taxa}}'

taxa <- unname(whisker::rowSplit(trees |> filter(common_six)))
whisker::whisker.render(template) |> cat()

taxa <- unname(whisker::rowSplit(trees))
whisker::whisker.render(template) |> writeLines("treebark.html")

