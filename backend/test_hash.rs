use bcrypt::{hash, verify, DEFAULT_COST};

fn main() {
    let password = "admin";
    let hashed = hash(password, DEFAULT_COST).expect("Failed to hash");
    println!("Generated hash: {}", hashed);

    // Test verification
    let test_verify = verify(password, &hashed).expect("Failed to verify");
    println!("Verification result: {}", test_verify);

    // Test with existing hash from migration
    let existing_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEiUM2";
    let test_existing = verify(password, existing_hash);
    println!("Existing hash verification: {:?}", test_existing);
}
