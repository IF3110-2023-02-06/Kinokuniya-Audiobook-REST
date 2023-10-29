-- Create the User table
CREATE TABLE IF NOT EXISTS User (
  userID INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  isAdmin BOOLEAN DEFAULT 0,
  -- Add more columns as needed

  -- Create an index on the email and username columns for quick lookups
  INDEX email_idx (email),
  INDEX username_idx (username)
);

-- Create the Book table
CREATE TABLE IF NOT EXISTS Book (
  bookID INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  authorID INT NOT NULL,
  audioPath VARCHAR(255)
  -- Add more columns as needed

  -- Create a foreign key constraint to link books to their authors
  CONSTRAINT fk_author
    FOREIGN KEY (authorID)
    REFERENCES User (userID)
    ON DELETE CASCADE
);

-- Define a unique constraint on the email and username columns
-- to enforce uniqueness
ALTER TABLE User
ADD CONSTRAINT unique_email UNIQUE (email),
ADD CONSTRAINT unique_username UNIQUE (username);
