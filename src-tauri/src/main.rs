use chrono::Utc;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::fs::File;
use std::io::{self, Read, Write};

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
struct User {
    user_name: String,
    password: String,
}

impl User {
    fn authenticate_with_other(&self, other: &User) -> bool {
        self.user_name == other.user_name && self.password == other.password
    }
}

#[derive(Serialize, Deserialize, Debug)]
struct Metadata {
    id: u32,
    user_name: String,
    next_id: u32,
}

#[warn(dead_code)]
#[derive(Serialize, Deserialize, Debug, Clone)]
struct Memo {
    id: u32,
    content: String,
    detail: String,
    is_uploaded: bool,
    category: String,
    display_count: u32,
    created_at: i64,
    created_by: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct WeightedMemo {
    id: u32,
    content: String,
    detail: String,
    is_uploaded: bool,
    category: String,
    display_count: u32,
    created_at: i64,
    created_by: String,
    weight: i64,
}

#[derive(Serialize, Deserialize, Debug)]
struct Category {
    #[serde(flatten)]
    categories: HashMap<String, Vec<Memo>>,
}

#[derive(Serialize, Deserialize, Debug)]
struct WeightedMemoList {
    memos: Vec<WeightedMemo>,
    index: usize,
}

const FILE_PATH: &str = "memos_new.json";

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!!", name)
}

#[tauri::command]
fn authenticate(user_name: &str, password: &str) -> bool {
    let registered_user_name = String::from("potekichi");
    let registered_password = String::from("123");
    let registered_user = User {
        user_name: registered_user_name,
        password: registered_password,
    };
    let user = User {
        user_name: user_name.to_string(),
        password: password.to_string(),
    };
    // let mut result = String::new();
    // result.push_str(if registered_user.authenticate_with_other(&user) {
    //     "認証成功"
    // } else {
    //     "認証失敗"[]
    // });
    let result = if registered_user.authenticate_with_other(&user) {
        true
    } else {
        false
    };
    println!("{}", result);
    result
}

#[tauri::command]
fn add_memo(content: &str, detail: &str, category: &str) -> Result<(), String> {
    let memo = create_memo(content, detail, category);
    match save_memo(memo) {
        Ok(()) => {
            get_sorted_memos().unwrap();
            Ok(())
        }
        Err(e) => Err(e),
    }
}

fn create_memo(content: &str, detail: &str, category: &str) -> Memo {
    let next_id = get_metadata().unwrap().next_id;
    let memo = Memo {
        id: next_id,
        content: content.to_string(),
        detail: detail.to_string(),
        category: category.to_string(),
        is_uploaded: false,
        display_count: 0,
        created_at: Utc::now().timestamp(),
        created_by: get_user(),
    };
    renew_next_id().unwrap();
    // println!("{:?}", memo);
    memo
}

//重み付けの計算
fn calculate_weight(memo: &Memo) -> i64 {
    let current_time = chrono::Utc::now().timestamp();
    let age = current_time - memo.created_at;

    // 表示回数が少ないほど重みを高くする（表示回数の逆数）
    let display_factor = if memo.display_count == 0 {
        1.0
    } else {
        1.0 / (memo.display_count as f64)
    };

    // 経過時間を重みに反映（経過時間の自然対数）
    let age_factor = if age > 0 { (age as f64).ln() } else { 0.0 };

    // 重みの計算
    let weight = age_factor * display_factor;
    (weight * 1000.0) as i64
}

#[tauri::command]
fn get_sorted_memos() -> Result<(), String> {
    let file_content = std::fs::read_to_string(FILE_PATH).map_err(|e| e.to_string())?;
    let categories: Category = serde_json::from_str(&file_content).map_err(|e| e.to_string())?;

    // すべてのメモを集めて重み付けでソート
    let mut all_memos: Vec<WeightedMemo> = categories
        .categories
        .values()
        .flatten()
        .map(|memo| WeightedMemo {
            id: memo.id,
            content: memo.content.clone(),
            detail: memo.detail.clone(),
            is_uploaded: memo.is_uploaded,
            category: memo.category.clone(),
            display_count: memo.display_count,
            created_at: memo.created_at,
            created_by: memo.created_by.clone(),
            weight: calculate_weight(memo),
        })
        .collect();
    all_memos.sort_by_key(|memo| -memo.weight);
    // println!("{:?}", all_memos);
    let memo_list = WeightedMemoList {
        memos: all_memos,
        index: 0,
    };
    //結果をmemorial.jsonに保存
    let serialized = serde_json::to_string(&memo_list).map_err(|e| e.to_string())?;
    // println!("{:?}", serialized);
    write_file_content(&serialized, "memorial.json").map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_user() -> String {
    get_metadata().unwrap().user_name
}

fn save_memo(memo: Memo) -> Result<(), String> {
    // メモを保存する処理
    println!("メモを取得します");

    let file_content = match read_file_content(FILE_PATH) {
        Ok(content) => content,
        Err(e) => {
            println!("Failed to read file: {}", e);
            return Err(format!("Failed to read file: {}", e));
        }
    };
    let category_name = memo.category.clone();
    let _category_name_for_memo = memo.category.clone();
    // JSONデータのデシリアライズ
    let categories: Result<Category, String> = match serde_json::from_str(&file_content) {
        Ok(categories) => Ok(categories),
        Err(e) => {
            println!("JSON parse error: {}", e);
            Err(format!("Failed to parse JSON: {}", e))
        }
    };
    let mut categories = categories.unwrap();
    println!("{:?}", categories);
    categories
        .categories
        .entry(category_name)
        .or_default()
        .push(memo);
    println!("{:?}", categories);
    let serialized = category_to_string(&categories).unwrap();
    if let Err(e) = write_file_content(&serialized, FILE_PATH) {
        return Err(e.to_string());
    };

    Ok(())
}

// jsonファイルに書き込み
fn write_file_content(content: &str, file_path: &str) -> Result<(), io::Error> {
    let mut file = File::create(file_path)?;
    file.write_all(content.as_bytes())?;
    Ok(())
}

// Category構造体を文字列に変換する
fn category_to_string(categories: &Category) -> Result<String, String> {
    let serialized = match serde_json::to_string(categories) {
        Ok(serialized) => serialized,
        Err(e) => {
            println!("Failed to serialize JSON: {}", e);
            return Err(format!("Failed to serialize JSON: {}", e));
        }
    };
    Ok(serialized)
}

fn read_file_content(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;
    let mut content = Vec::new();
    file.read_to_end(&mut content)?;
    let content = String::from_utf8_lossy(&content).into_owned();
    println!(); // 新しい行を追加
    Ok(content.trim().to_string())
}

#[tauri::command]
fn get_categories() -> Result<Vec<String>, String> {
    println!("メモを取得します");

    let file_content = match read_file_content(FILE_PATH) {
        Ok(content) => {
            println!("File content read successfully:\n{}", content);
            content
        }
        Err(e) => {
            println!("Failed to read file: {}", e);
            return Err(format!("Failed to read file: {}", e));
        }
    };

    // JSONデータのデシリアライズ
    let category: Result<Category, _> = serde_json::from_str(&file_content);
    match category {
        Ok(category) => {
            println!("Successfully parsed JSON: {:?}", category);
            Ok(category.categories.keys().cloned().collect())
        }
        Err(e) => {
            println!("JSON parse error: {}", e);
            Err(format!("Failed to parse JSON: {}", e))
        }
    }
}

fn read_metadata() -> Result<String, String> {
    let content = read_file_content("metadata.json");
    match content {
        Ok(content) => Ok(content),
        Err(e) => Err(e.to_string()),
    }
}

//メタデータを取得する
fn get_metadata() -> Result<Metadata, String> {
    let content = read_metadata().unwrap();
    let metadata: Result<Metadata, _> = serde_json::from_str(&content);
    match metadata {
        Ok(metadata) => {
            println!("Successfully parsed JSON: {:?}", metadata);
            Ok(metadata)
        }
        Err(e) => {
            println!("JSON parse error: {}", e);
            Err(format!("Failed to parse JSON: {}", e))
        }
    }
}

//メタデータのidに1を加算して保存する
fn renew_next_id() -> Result<(), String> {
    let mut metadata = get_metadata().unwrap();
    metadata.next_id += 1;
    let serialized = match serde_json::to_string(&metadata) {
        Ok(serialized) => serialized,
        Err(e) => {
            println!("Failed to serialize JSON: {}", e);
            return Err(format!("Failed to serialize JSON: {}", e));
        }
    };
    if let Err(e) = write_file_content(&serialized, "metadata.json") {
        return Err(e.to_string());
    };
    Ok(())
}

#[tauri::command]
fn get_all_memo() -> Result<Category, String> {
    println!("メモを取得します");

    let file_content = match read_file_content(FILE_PATH) {
        Ok(content) => {
            println!("File content read successfully:\n{}", content);
            content
        }
        Err(e) => {
            println!("Failed to read file: {}", e);
            return Err(format!("Failed to read file: {}", e));
        }
    };

    // JSONデータのデシリアライズ
    let category: Result<Category, _> = serde_json::from_str(&file_content);
    match category {
        Ok(category) => {
            println!("Successfully parsed JSON: {:?}", category);
            Ok(category)
        }
        Err(e) => {
            println!("JSON parse error: {}", e);
            for (index, line) in file_content.lines().enumerate() {
                println!("{:4}: {}", index + 1, line);
            }
            Err(format!("Failed to parse JSON: {}", e))
        }
    }
}

#[tauri::command]
fn get_next_memo() -> Result<WeightedMemo, String> {
    let weighted_data_path = "memorial.json";
    // 重み付けされたデータを読み込む
    let file_content = read_file_content(&weighted_data_path).map_err(|e| e.to_string())?;
    let mut memo_list: WeightedMemoList =
        serde_json::from_str(&file_content).map_err(|e| e.to_string())?;
    //インデックスを取得
    let current_index = memo_list.index;
    let result: Result<WeightedMemo, String> = if current_index < memo_list.memos.len() {
        let next_memo = memo_list.memos[current_index].clone();
        increment_display_count(next_memo.id)?;
        println!("incremented");
        Ok(next_memo)
    } else {
        Err("No more memos available.".to_string())
    };
    //インデックスを更新
    let updated_index = current_index + 1;
    memo_list.index = updated_index;
    let serialized = serde_json::to_string(&memo_list).map_err(|e| e.to_string())?;
    write_file_content(&serialized, weighted_data_path).map_err(|e| e.to_string())?;
    result
}

fn increment_display_count(memo_id: u32) -> Result<(), String> {
    let data_path = "memos_new.json";

    // 元のデータを読み込む
    let file_content = read_file_content(&data_path).map_err(|e| e.to_string())?;
    let mut categories: HashMap<String, Vec<Memo>> =
        serde_json::from_str(&file_content).map_err(|e| e.to_string())?;

    // メモの表示回数を更新
    for memos in categories.values_mut() {
        if let Some(memo) = memos.iter_mut().find(|memo| memo.id == memo_id) {
            memo.display_count += 1;
        }
    }

    // JSONとして保存
    let updated_content = serde_json::to_string_pretty(&categories).map_err(|e| e.to_string())?;
    write_file_content(&updated_content, &data_path).map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
struct AuthRequest {
    username: String,
    password: String,
}
#[derive(Serialize, Deserialize, Debug)]
struct AuthResopnse {
    userId: u32,
    username: String,
}
#[tauri::command]
async fn auth(username: String, password: String) -> Result<String, String> {
    let client = Client::new();
    let auth_request = AuthRequest { username, password };
    println!("info {:?}", &auth_request);
    let res = client
        .post("http://localhost:8000/login")
        .json(&auth_request)
        .send()
        .await;
    let res = match res {
        Ok(res) => res,
        Err(e) => {
            return Err(e.to_string());
        }
    };
    println!("res{:?}", res);
    let body = res.text().await.unwrap();
    let deserialize = serde_json::from_str::<AuthResopnse>(&body).unwrap();
    println!("{:?}", deserialize);
    //ユーザ名をフロントに返す
    //　メタファイルにユーザー名を保存
    //メタデータファイルから情報を取得
    let metadata = get_metadata().unwrap();
    let metadata = Metadata {
        id: metadata.id,
        user_name: deserialize.username,
        next_id: metadata.next_id,
    };
    let serialized = serde_json::to_string(&metadata).unwrap();
    write_file_content(&serialized, "metadata.json").unwrap();
    Ok(metadata.user_name)
}

#[derive(Serialize, Deserialize, Debug)]
struct MemoRequest {
    username: String,
    content: String,
    detail: String,
}

//メモをアップロード
#[tauri::command]
async fn upload_memo(memo: Memo) -> Result<bool, String> {
    let login_user = get_user();
    if memo.is_uploaded {
        return Err("すでにアップロードされています".to_string());
    }
    if login_user != memo.created_by {
        return Err("ログインユーザーとメモの作成者が一致しません".to_string());
    }
    let memo_request = MemoRequest {
        username: memo.created_by,
        content: memo.content,
        detail: memo.detail,
    };

    let client = Client::new();
    let res = client
        .post("http://localhost:8000/api/memo")
        .json(&memo_request)
        .send()
        .await;
    let res = match res {
        Ok(res) => res,
        Err(e) => {
            return Err(e.to_string());
        }
    };
    //データを書き換える
    let file_content = read_file_content(FILE_PATH).unwrap();
    let mut categories: Category = serde_json::from_str(&file_content).unwrap();
    let memos = categories.categories.get_mut(&memo.category).unwrap();
    let memo = memos
        .iter_mut()
        .find(|ob_memo| ob_memo.id == memo.id)
        .unwrap();
    println!("aaa:{:?}", memo);
    memo.is_uploaded = true;
    let serialized = serde_json::to_string(&categories).unwrap();
    write_file_content(&serialized, FILE_PATH).unwrap();

    println!("{:?}", res);
    Ok(true)
}

//カテゴリーを追加
#[tauri::command]
fn add_category(category: &str) -> Result<(), String> {
    let file_content = read_file_content(FILE_PATH).unwrap();
    let mut categories: Category = serde_json::from_str(&file_content).unwrap();
    categories
        .categories
        .insert(category.to_string(), Vec::new());
    let serialized = serde_json::to_string(&categories).unwrap();
    write_file_content(&serialized, FILE_PATH).unwrap();
    Ok(())
}

fn main() {
    println!("----------------------------");
    // get_sorted_memos();
    println!("---------次のメモ------------");
    println!("-----------------------------");
    println!("{:?}", get_metadata());
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            authenticate,
            add_memo,
            get_all_memo,
            get_categories,
            get_user,
            get_next_memo,
            auth,
            upload_memo,
            add_category,
            get_sorted_memos
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// 関数のテスト
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_authenticate() {
        let user_name = "potekichi";
        let password = "123";
        assert_eq!(authenticate(user_name, password), true);
    }

    #[test]
    fn test_create_memo() {
        let title = "タイトル";
        let content = "内容";
        let category = "未分類";
        let created_by = "potekichi";
        let memo = create_memo(title, content, category);
        assert_eq!(memo.content, title);
        assert_eq!(memo.content, content);
        assert_eq!(memo.created_by, created_by);
    }
}
