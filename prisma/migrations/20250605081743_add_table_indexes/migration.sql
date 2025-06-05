-- CreateTable
CREATE TABLE "emails" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from_address" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "message_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_files" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "email_id" TEXT NOT NULL,

    CONSTRAINT "email_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "email_files" ADD CONSTRAINT "email_files_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
