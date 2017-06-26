DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS user_sign;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email_address VARCHAR(255) NOT NULL UNIQUE,
    hashed_pw VARCHAR NOT NULL
);

CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    age INTEGER,
    city VARCHAR(255),
    url VARCHAR
);

CREATE TABLE user_sign (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    signature VARCHAR
);
