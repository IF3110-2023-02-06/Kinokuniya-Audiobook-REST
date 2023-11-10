-- Create the User table
CREATE TABLE IF NOT EXISTS "user" (
  "userID" SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255) NOT NULL
);

-- Create the Series table
CREATE TABLE IF NOT EXISTS "series" (
  "seriesID" SERIAL PRIMARY KEY,
  "seriesName" VARCHAR(255) NOT NULL
);

-- Create the Book table
CREATE TABLE IF NOT EXISTS "book" (
  "bookID" SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  "authorID" INT NOT NULL,
  "category" VARCHAR(255) NOT NULL,
  "seriesID" INT,
  "bookDesc" TEXT NOT NULL,
  "price" INT NOT NULL,
  "publicationDate" DATE NOT NULL,
  "coverPath" VARCHAR(255) NOT NULL,
  "audioPath" VARCHAR(255) NOT NULL,
  FOREIGN KEY ("authorID") REFERENCES "user" ("userID") ON DELETE CASCADE,
  FOREIGN KEY ("seriesID") REFERENCES "series" ("seriesID") ON DELETE CASCADE
);

-- Add sample series
INSERT INTO "series" ("seriesName")
VALUES ('The Lord of the Rings'),
('Harry Potter'),
('The Hunger Games'),
('The Chronicles of Narnia');

-- Define a unique constraint on the email and username columns
-- to enforce uniqueness
ALTER TABLE "user"
ADD CONSTRAINT "unique_email" UNIQUE (email),
ADD CONSTRAINT "unique_username" UNIQUE (username);
