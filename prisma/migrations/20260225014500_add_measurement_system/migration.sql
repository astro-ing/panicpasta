-- CreateEnum
CREATE TYPE "MeasurementSystem" AS ENUM ('metric', 'imperial');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "measurementSystem" "MeasurementSystem";
