import { Router, type IRouter } from "express";
import { db, paymentsTable, projectsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateCheckoutSessionBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import Stripe from "stripe";
import { logger } from "../lib/logger";

type AuthReq = { user?: { userId: number; email: string; role: string } };

const router: IRouter = Router();

function getStripe(): Stripe | null {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-03-31.basil" });
}

router.post("/payments/create-checkout-session", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & AuthReq;
  const userId = authReq.user!.userId;

  const parsed = CreateCheckoutSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { projectId } = parsed.data;

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const stripe = getStripe();
  if (!stripe) {
    res.status(400).json({ error: "Stripe is not configured. Please connect your Stripe account." });
    return;
  }

  const domains = process.env["REPLIT_DOMAINS"]?.split(",") ?? [];
  const baseUrl = domains.length > 0 ? `https://${domains[0]}` : "http://localhost:80";

  const [payment] = await db
    .insert(paymentsTable)
    .values({ userId, projectId, amount: 999, status: "pending" })
    .returning();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Feature Project: ${project.title}`,
            description: "Get your project featured at the top of the listing for increased visibility",
          },
          unit_amount: 999,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/projects/${projectId}?payment=success`,
    cancel_url: `${baseUrl}/projects/${projectId}?payment=cancelled`,
    metadata: {
      paymentId: String(payment.id),
      projectId: String(projectId),
      userId: String(userId),
    },
  });

  await db.update(paymentsTable).set({ stripeSessionId: session.id }).where(eq(paymentsTable.id, payment.id));

  res.json({ url: session.url ?? "" });
});

router.post("/payments/webhook", async (req, res): Promise<void> => {
  const stripe = getStripe();
  if (!stripe) {
    res.json({ status: "ok" });
    return;
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];

  if (!webhookSecret || !sig) {
    res.json({ status: "ok" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    req.log.warn({ err }, "Webhook signature verification failed");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata?.paymentId;
    const projectId = session.metadata?.projectId;

    if (paymentId && projectId) {
      await db
        .update(paymentsTable)
        .set({ status: "completed" })
        .where(eq(paymentsTable.id, parseInt(paymentId, 10)));

      await db
        .update(projectsTable)
        .set({ isFeatured: true })
        .where(eq(projectsTable.id, parseInt(projectId, 10)));

      logger.info({ paymentId, projectId }, "Payment completed, project featured");
    }
  }

  res.json({ status: "ok" });
});

router.get("/payments/my-payments", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & AuthReq;
  const userId = authReq.user!.userId;

  const payments = await db
    .select({
      id: paymentsTable.id,
      userId: paymentsTable.userId,
      projectId: paymentsTable.projectId,
      amount: paymentsTable.amount,
      status: paymentsTable.status,
      stripeSessionId: paymentsTable.stripeSessionId,
      projectTitle: projectsTable.title,
      userEmail: usersTable.email,
      createdAt: paymentsTable.createdAt,
    })
    .from(paymentsTable)
    .leftJoin(projectsTable, eq(paymentsTable.projectId, projectsTable.id))
    .leftJoin(usersTable, eq(paymentsTable.userId, usersTable.id))
    .where(eq(paymentsTable.userId, userId))
    .orderBy(desc(paymentsTable.createdAt));

  res.json(payments.map((p) => ({
    ...p,
    projectTitle: p.projectTitle ?? null,
    userEmail: p.userEmail ?? null,
  })));
});

export default router;
