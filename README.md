# CampusFoodLink
## Overview
A Capstone project where students were proposed an issue for students experiencing long wait times, decentrialized reccord keeping, and a decentrialized stock and order managmement system for vendors
## Project Team
| Member | Role | Description |
|---|---|---|
|Matthew C. |Project Mananger| Played a key role in overall project success by helping peers with their workload as well as orchestrating overall project schedule and risk factors. Assisted in execution of all duties|
|Nicholas D.|Business Analyst| Assisted in evaluations of how the project should operate and assisted with developing solutions|
|Matthew (Lance) E.|Developer|Assisted in python scripts and HTML/CSS/JS coding|
|Richard N.|UI UX Developer/Artist|Created Wireframes/Mockups for website, credit for all graphics|
|Jesse D.|Tester|Discovered causes for issues, ensured quality for deliverables and stakeholder satisfaction|

## Tech Stack
| Tool | Purpose |
|---|---|
|Github Pages|Front-end / Back-end|
|PostgreSQL (Neon)|Cloud DBMS Solution|
|pgAdmin4|DBMS Administration|
|MS Visio|Diagram Design|
|MS Project|Scheduling|
|MS Word + Obsidian|Documentation for project (.docx & .md)|

## Features
**Required**
 - User Login
 - Vendor Menus
 - Meal Plan Balance Display
 - Order Creation
 - Order Status

**Optional**
 - Push-style notifications
 - Dietary Filters
 - Data Visualizations
 - QR-Based order pickup confirmation 

## Database Schema
|Table Name|Column Names|
|---|---|
|menus|id **(PK)**, vendor_id **(FK)**, item_name, item_description, item_price|
|orderItems|id **(PK)**, order_id **(FK)**, menu_item_id **(FK)**, quantity, item_price **(FK)**, price_total **(Calculated Field)**|
|orders|id **(PK)**, user_id **(FK)**, vendor_id **(FK)**, date_time, status, discount, total_price|
|roles|id **(PK)**, title, description|
|users|id **(PK)**, last_name, first_name, date_birth, phone_number, email, password **(SHA256 encrypted)**, role_id **(FK)**, balance|
|vendors|id **(PK)**, name, phone_number, email, address, city, state, zip_code|

## Constraints
- No real payments
- System must be mobile friendly
- Database and UI structure must be justifiable

## Schedule
|Phase|Duration (Estimated)|Start Date (Projected)|
|---|---|---|
|Initiation|10.25 days|6/10/26|
|Requirements|5 days|6/22/26|
|Design|9.25 Days|6/29/26|
|Development|17.5 days|7/8/26|
|Testing|4 days|7/27/26|
|Deployment / Presentation|5 days|7/31/26|
|Project Closure|5 days|8/5/26|

## Deliverables
- Project Chart
- Project Manager Schedule (Gantt)
- Requirements Document
- Architecture Diagram
- Relational Database Schema + CRUD
- Front End Prototype
- Security Considerations
- Testing Plan

## Author
-Matthew C. (KlarityVII)
