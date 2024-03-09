/*
  Warnings:

  - You are about to drop the column `allowlisted` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `blocklisted` on the `User` table. All the data in the column will be lost.
  - Added the required column `allowlisted` to the `GuildUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blocklisted` to the `GuildUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `GuildUser` ADD COLUMN `allowlisted` BOOLEAN NOT NULL,
    ADD COLUMN `blocklisted` BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `allowlisted`,
    DROP COLUMN `blocklisted`;
