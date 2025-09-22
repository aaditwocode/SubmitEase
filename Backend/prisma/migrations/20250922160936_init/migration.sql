-- DropIndex
DROP INDEX "User_password_key";

-- CreateTable
CREATE TABLE "Conference" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "link" TEXT NOT NULL,
    "hostID" INTEGER NOT NULL,

    CONSTRAINT "Conference_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Conference" ADD CONSTRAINT "Conference_hostID_fkey" FOREIGN KEY ("hostID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
