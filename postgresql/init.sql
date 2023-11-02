-- Create the User table
CREATE TABLE IF NOT EXISTS "user" (
  "userID" SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255) NOT NULL
);

-- Create the Book table
CREATE TABLE IF NOT EXISTS "book" (
  "bookID" SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  "authorID" INT NOT NULL,
  "category" VARCHAR(255) NOT NULL,
  "bookDesc" TEXT NOT NULL,
  "price" INT NOT NULL,
  "publicationDate" DATE NOT NULL,
  "coverPath" VARCHAR(255) NOT NULL,
  "audioPath" VARCHAR(255) NOT NULL,
  FOREIGN KEY ("authorID") REFERENCES "user" ("userID") ON DELETE CASCADE
);

-- Define a unique constraint on the email and username columns
-- to enforce uniqueness
ALTER TABLE "user"
ADD CONSTRAINT "unique_email" UNIQUE (email),
ADD CONSTRAINT "unique_username" UNIQUE (username);
