use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlaylistItem {
    pub id: Option<String>,
    pub filename: Option<String>,
    #[serde(alias = "source")]
    pub path: String,
    pub duration: f64,
    #[serde(default)]
    pub r#in: f64,
    #[serde(default)]
    pub out: f64,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub media_type: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub is_filler: Option<bool>,
}

fn main() {
    let json_data = r#"[{"duration":596.461667,"id":"e1547ed1-2d11-44dd-aa24-2cfbc57fb79f_v4b44o5a9","path":"/var/lib/onepa-playout/media/big_buck_bunny_1080p_h264.mov","source":"/var/lib/onepa-playout/media/big_buck_bunny_1080p_h264.mov","title":"big_buck_bunny_1080p_h264.mov","type":"library"}]"#;

    let result = serde_json::from_str::<Vec<PlaylistItem>>(json_data);

    match result {
        Ok(items) => println!("Success: Parsed {} items", items.len()),
        Err(e) => println!("Error: {}", e),
    }
}
