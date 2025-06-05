import { NextRequest, NextResponse } from "next/server";
import { parseEmailFormData } from "@/utils/email-parser";
import prisma from "@/libs/prisma";
import { put } from "@vercel/blob";
import { InvoiceProcessor } from "@/libs/invoice-processor";
import { createStreamableValue } from "ai/rsc";

const invoiceProcessor = new InvoiceProcessor();

export async function POST(req: NextRequest) {
  console.log("Received request at /api/webhook/owlrelay");

  try {
    const formData = await req.formData();
    const stream = createStreamableValue();
    
    if (formData) {
      console.log("Form data received:", Object.fromEntries(formData.entries()));
      
      // Parse email data using helper function
      const emailMetadata = parseEmailFormData(formData);
      
      // Get email address from metadata
      const fromAddress = emailMetadata.from.address;
      const toAddress = emailMetadata.to[0]?.address || 'unknown';
      
      console.log("Processed email metadata:", emailMetadata);
      
      // Create email record in database
      const email = await prisma.email.create({
        data: {
          fromAddress,
          toAddress,
          subject: emailMetadata.subject,
          date: new Date(emailMetadata.date),
          messageId: emailMetadata.message_id,
          content: emailMetadata.text || ''
        }
      });
      
      if (!email || !email.id) {
        throw new Error("Failed to create email record");
      }
      
      // Handle files if they exist
      const files = formData.getAll('attachments[]');
      
      console.log("Files:", files);

      if (files && files.length > 0) {
        console.log("Processing files:", files.length);
        
        for (const file of files) {
          if (!(file instanceof File)) {
            console.log("Warning: Invalid file");
            continue;
          }
          
          const filename = file.name;
          console.log(`File: ${filename}`);
          
          const fileContent = await file.arrayBuffer();
          if (!fileContent || fileContent.byteLength === 0) {
            console.log(`Warning: Empty file content for ${filename}`);
            continue;
          }
          
          const newPath = `email_files/${fromAddress}/${filename}`;
          console.log(`Saving file to ${newPath}`);
          
          try {
            const blob = await put(newPath, fileContent, {
              access: 'public',
              addRandomSuffix: true
            });
            
            console.log(`Successfully saved file to ${newPath}`);
            
            // Create email file record in database
            await prisma.emailFile.create({
              data: {
                name: filename,
                url: blob.url,
                emailId: email.id
              }
            });

            // After saving the file, process it if it's an invoice
            if (filename.toLowerCase().endsWith('.pdf') || 
                filename.toLowerCase().endsWith('.jpg') || 
                filename.toLowerCase().endsWith('.png')) {
              try {
                // Process the invoice
                // await invoiceProcessor.processInvoice(blob.url);
                stream.update({ status: 'processing', file: filename });
              } catch (error: any) {
                console.error("Error processing invoice:", error);
                stream.update({ status: 'error', file: filename, error: error.message });
              }
            }
          } catch (error: any) {
            console.error("Error in blob.put:", error);
            stream.update({ status: 'error', file: filename, error: error.message });
            throw error;
          }
        }
      } else {
        console.log("No files attached to the email");
      }
    }
    
    stream.done();
    return NextResponse.json({ status: 'success', stream: stream.value }, { status: 200 });
  } catch (e: any) {
    console.error("Error processing webhook:", e);
    return NextResponse.json(
      { status: 'error', message: e.message },
      { status: e.status || 500 }
    );
  }
}
