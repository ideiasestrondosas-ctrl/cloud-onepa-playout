use anyhow::{anyhow, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FetchedMetadata {
    pub title: String,
    pub description: Option<String>,
    pub year: Option<String>,
    pub tags: Vec<String>,
    pub poster_url: Option<String>,
    pub cast: Option<Vec<String>>,
    pub rating: Option<String>,
    pub source_service: Option<String>,
    pub source_url: Option<String>,
}

#[derive(Clone)]
pub struct MetadataFetcherService {
    client: Client,
    tmdb_api_key: String,
    omdb_api_key: String,
    tvmaze_api_key: String,
}

impl MetadataFetcherService {
    pub fn new(tmdb_key: String, omdb_key: String, tvmaze_key: String) -> Self {
        Self {
            client: Client::new(),
            tmdb_api_key: tmdb_key,
            omdb_api_key: omdb_key,
            tvmaze_api_key: tvmaze_key,
        }
    }

    pub fn clean_filename(&self, filename: &str) -> (String, Option<String>) {
        let path = Path::new(filename);
        let stem = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or(filename);

        // Common release tags to strip
        let trash_words = [
            "1080p", "720p", "480p", "2160p", "4k", "bluray", "webrip", "h264", "x264", "x265",
            "hevc", "aac", "ac3", "dts", "hdr", "remux", "proper", "repack",
        ];

        let clean_name = stem.replace('.', " ").replace('_', " ");
        let mut year = None;

        // Try to find a year (19xx or 20xx)
        let parts: Vec<&str> = clean_name.split_whitespace().collect();
        let mut title_parts = Vec::new();

        for part in parts {
            // Check if year
            if part.len() == 4 && part.chars().all(|c| c.is_digit(10)) && part.starts_with("19")
                || part.starts_with("20")
            {
                year = Some(part.to_string());
                break; // Assume title ends at year
            }

            // Check if trash
            if trash_words.contains(&part.to_lowercase().as_str()) {
                break; // Assume title ends at tech specs
            }

            title_parts.push(part);
        }

        (title_parts.join(" "), year)
    }

    pub async fn fetch_metadata(&self, filename: &str) -> Result<FetchedMetadata> {
        let (query, year) = self.clean_filename(filename);
        log::info!(
            "Fetching metadata for: '{}' (Derived from: '{}')",
            query,
            filename
        );

        if query.trim().is_empty() {
            return Err(anyhow!("Could not determine title from filename"));
        }

        // Try TMDB first (if key exists), then OMDb
        if !self.tmdb_api_key.is_empty() {
            match self.fetch_tmdb(&query, year.as_deref()).await {
                Ok(meta) => return Ok(meta),
                Err(e) => log::warn!("TMDB fetch failed: {}", e),
            }
        }

        // Try OMDb (or free public instance if possible)
        if !self.omdb_api_key.is_empty() {
            if let Ok(meta) = self.fetch_omdb(&query, year.as_deref()).await {
                return Ok(meta);
            }
        }

        // Try TVMaze last (mostly for series/shows)
        if !self.tvmaze_api_key.is_empty() {
            match self.fetch_tvmaze(&query).await {
                Ok(meta) => return Ok(meta),
                Err(e) => log::warn!("TVMaze fetch failed: {}", e),
            }
        }

        Err(anyhow!(
            "No API keys configured or no results found. Please set TMDB_API_KEY or OMDB_API_KEY env vars."
        ))
    }

    async fn fetch_tmdb(&self, title: &str, _year: Option<&str>) -> Result<FetchedMetadata> {
        let url = "https://api.themoviedb.org/3/search/multi";
        let params = vec![
            ("api_key", self.tmdb_api_key.as_str()),
            ("query", title),
            ("language", "pt-PT"), // Preferring Portuguese/European Portuguese
        ];

        let response = self.client.get(url).query(&params).send().await?;

        if !response.status().is_success() {
            return Err(anyhow!("TMDB API Error: {}", response.status()));
        }

        let json: serde_json::Value = response.json().await?;
        let results = json["results"]
            .as_array()
            .ok_or(anyhow!("Invalid TMDB format"))?;

        if let Some(first) = results.first() {
            let media_type = first["media_type"].as_str().unwrap_or("movie");
            let fetched_title = first["title"]
                .as_str()
                .or(first["name"].as_str())
                .unwrap_or(title)
                .to_string();
            let overview = first["overview"].as_str().map(|s| s.to_string());
            let release_date = first["release_date"]
                .as_str()
                .or(first["first_air_date"].as_str());
            let fetched_year = release_date.map(|d| d.chars().take(4).collect::<String>());
            let poster_path = first["poster_path"].as_str();
            let poster_url = poster_path.map(|p| format!("https://image.tmdb.org/t/p/w500{}", p));

            // Extra fetch for Details (Genres, Cast) not fully in Search results
            // But for speed we can skip or implement later.
            // For now, let's map what we have.

            // Note: TMDB Genres are IDs in search results, need mapping or separate call.
            // Simplified for now.

            let tmdb_id = first["id"].as_i64();
            let source_url = match (media_type, tmdb_id) {
                ("movie", Some(id)) => Some(format!("https://www.themoviedb.org/movie/{}", id)),
                ("tv", Some(id)) => Some(format!("https://www.themoviedb.org/tv/{}", id)),
                _ => None,
            };

            Ok(FetchedMetadata {
                title: fetched_title,
                description: overview,
                year: fetched_year,
                tags: vec![media_type.to_string()], // Placeholder until genre fetch
                poster_url,
                cast: None, // Requires details call
                rating: first["vote_average"].as_f64().map(|v| format!("{:.1}", v)),
                source_service: Some("TMDB".to_string()),
                source_url,
            })
        } else {
            Err(anyhow!("No results found on TMDB"))
        }
    }

    async fn fetch_omdb(&self, title: &str, year: Option<&str>) -> Result<FetchedMetadata> {
        let url = "http://www.omdbapi.com/";
        let mut params = vec![("apikey", self.omdb_api_key.as_str()), ("t", title)];
        if let Some(y) = year {
            params.push(("y", y));
        }

        let response = self.client.get(url).query(&params).send().await?;
        let json: serde_json::Value = response.json().await?;

        if json["Response"] == "False" {
            return Err(anyhow!("OMDb not found: {}", json["Error"]));
        }

        let fetched_title = json["Title"].as_str().unwrap_or(title).to_string();
        let plot = json["Plot"].as_str().map(|s| s.to_string());
        let fetched_year = json["Year"].as_str().map(|s| s.to_string());
        let poster = json["Poster"].as_str();
        let poster_url = if poster == Some("N/A") {
            None
        } else {
            poster.map(|s| s.to_string())
        };
        let genre = json["Genre"]
            .as_str()
            .unwrap_or("")
            .split(", ")
            .map(|s| s.to_string())
            .collect();
        let cast = json["Actors"]
            .as_str()
            .map(|s| s.split(", ").map(|a| a.to_string()).collect());
        let rating = json["imdbRating"].as_str().map(|s| s.to_string());

        let imdb_id = json["imdbID"].as_str();
        let source_url = imdb_id.map(|id| format!("https://www.imdb.com/title/{}/", id));

        Ok(FetchedMetadata {
            title: fetched_title,
            description: plot,
            year: fetched_year,
            tags: genre,
            poster_url,
            cast,
            rating,
            source_service: Some("OMDb".to_string()),
            source_url,
        })
    }

    async fn fetch_tvmaze(&self, title: &str) -> Result<FetchedMetadata> {
        // TVMaze search usually doesn't need a key, but we can support one if premium features exist
        // For standard endpoint it's just public search
        let url = "https://api.tvmaze.com/search/shows";
        let params = vec![("q", title)];

        let response = self.client.get(url).query(&params).send().await?;
        let json: serde_json::Value = response.json().await?;

        let show = json
            .as_array()
            .and_then(|arr| arr.first())
            .and_then(|item| item["show"].as_object())
            .ok_or(anyhow!("No results found on TVMaze"))?;

        let fetched_title = show["name"].as_str().unwrap_or(title).to_string();
        // Remove HTML tags from summary
        let raw_summary = show["summary"].as_str().unwrap_or("").to_string();
        let description = Some(
            raw_summary
                .replace("<p>", "")
                .replace("</p>", "")
                .replace("<b>", "")
                .replace("</b>", ""),
        );

        let year = show["premiered"]
            .as_str()
            .map(|d| d.chars().take(4).collect());
        let poster_url = show["image"]["original"].as_str().map(|s| s.to_string());

        let rating = show["rating"]["average"]
            .as_f64()
            .map(|v| format!("{:.1}", v));
        let genres = show["genres"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();

        let source_url = show["url"].as_str().map(|s| s.to_string());

        Ok(FetchedMetadata {
            title: fetched_title,
            description,
            year,
            tags: genres,
            poster_url,
            cast: None, // Cast needs separate call `shwo_id/cast`
            rating,
            source_service: Some("TVMaze".to_string()),
            source_url,
        })
    }

    // Fallback logic to just return clean filename if no API
    #[allow(dead_code)]
    pub fn fallback_metadata(&self, filename: &str) -> FetchedMetadata {
        let (title, year) = self.clean_filename(filename);
        FetchedMetadata {
            title,
            description: None,
            year,
            tags: Vec::new(),
            poster_url: None,
            cast: None,
            rating: None,
            source_service: Some("Local Filename".to_string()),
            source_url: None,
        }
    }
}
