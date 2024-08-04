# Identify Contact API

Live API: POST https://identify-0v6o.onrender.com/api/identify

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- PostgreSQL

## Setup

1. Clone the repository

2. Install dependencies:
`npm install`

3. Create a `.env` file in the root directory with the following content:
PORT=3000
NODE_ENV=development
DB_HOST=your-db_host
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

4. Build the project:
`npm run build`

## Running the API

1. Start the server:
`npm start`

2. The API will be available at `http://localhost:3000`

## API Endpoints

- POST `/api/identify`
- Accepts JSON body with `email` and/or `phoneNumber`
- Returns consolidated contact information

## Development

To run the project in development mode with auto-reloading:
`npm run dev`