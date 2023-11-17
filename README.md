# Kinokuniya Audiobook REST Service

This repository is intended to be a REST service for the Kinokuniya Audiobook Website created with Express.ts, Prisma ORM, and PostgreSQL. This service mainly handles the CRUD operations for the books and series, along with communicating with the SOAP service to get subscriber data.

## Database
![Database](./screenshots/rest-database.png)

## API Endpoints
Endpoint | Description | Author | NIM
--- | --- | --- | ---
`GET /api/book` | Get all books by user | Enrique Alifio Ditya | 13521142
`GET /api/book/:id` | Get book by requester id | Enrique Alifio Ditya | 13521142
`GET /api/app/book/:authorID` | Fetches all books by author | Enrique Alifio Ditya | 13521142
`GET /api/app/book/:bookID` | Fetches book by book ID | Enrique Alifio Ditya | 13521142
`GET /api/series/` | Get all series | Enrique Alifio Ditya | 13521142
`GET /api/analytics` | Get all user analytics | Enrique Alifio Ditya | 13521142
`POST /api/book` | Create a new book | Enrique Alifio Ditya | 13521142
`POST /api/series` | Create a new series | Enrique Alifio Ditya | 13521142
`PUT /api/book/:id` | Update a book | Enrique Alifio Ditya | 13521142
`DELETE /api/book/:id` | Delete a book | Enrique Alifio Ditya | 13521142