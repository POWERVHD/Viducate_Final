import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function POST(req) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  // Handle the webhook
  if (eventType === "user.created") {
    const {
      email_addresses,
      first_name,
      last_name,
      id: clerkUserId,
      image_url,
    } = evt.data;
    const email = email_addresses[0].email_address;

    console.log("Creating user in database from webhook:", {
      email,
      clerkUserId,
    });

    try {
      await db.user.create({
        data: {
          email,
          clerkUserId,
          name: `${first_name} ${last_name}`.trim(),
          imageUrl: image_url,
        },
      });
      console.log("User created successfully in database from webhook");
    } catch (error) {
      console.error("Error creating user in database:", error);
      return new Response("Error creating user in database", {
        status: 500,
      });
    }
  }

  return new Response("", { status: 200 });
}
