CREATE TABLE "users"(
id SERIAL PRIMARY KEY,
last_name VARCHAR(50) NOT NULL,
first_name VARCHAR(50) NOT NULL,
date_birth DATE NOT NULL,
phone_number VARCHAR(15) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
password TEXT NOT NULL,
role INT DEFAULT 1,
balance NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE "roles"(
id SERIAL PRIMARY KEY,
title varchar(50) UNIQUE NOT NULL,
Description varchar(255) NOT NULL
);

CREATE TABLE "vendors"(
id SERIAL PRIMARY KEY,
name varchar(255) NOT NULL,
phone_number VARCHAR(15) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
address VARCHAR(255) NOT NULL,
city VARCHAR(30) NOT NULL,
state CHAR(2) NOT NULL,
zip_code VARCHAR(15) NOT NULL
);

CREATE TABLE "orders"(
id SERIAL PRIMARY KEY,
user_id INT NOT NULL,
vendor_id INT NOT NULL,
date_time DATE NOT NULL,
status VARCHAR(20) NOT NULL,
discount NUMERIC(10,2) DEFAULT 0,
total_price INT NOT NULL
);

CREATE TABLE "orderItems"(
id SERIAL PRIMARY KEY,
order_id INT NOT NULL,
menu_item_id INT NOT NULL,
quantity INT NOT NULL,
item_price NUMERIC(10,2 NOT NULL,
price_total NUMERIC(10,2) GENERATED ALWAYS AS (quantity * item_price) STORED
);

CREATE TABLE "menus"(
id SERIAL PRIMARY KEY,
vendor_id INT NOT NULL,
item_name VARCHAR(50) NOT NULL,
item_description VARCHAR(255) NOT NULL,
item_price NUMERIC(10,2NOT NULL
);
