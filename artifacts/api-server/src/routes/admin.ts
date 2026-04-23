import { Router, type IRouter } from "express";
import { db, usersTable, projectsTable, votesTable, paymentsTable } from "@workspace/db";
import { eq, desc, count, sum, and } from "drizzle-orm";
import { AdminListUsersQueryParams, AdminListProjectsQueryParams } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/admin/users", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminListUsersQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const [{ total }] = await db.select({ total: count() }).from(usersTable);
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).offset(offset).limit(limit);

  res.json({
    users: users.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt })),
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  });
});

router.get("/admin/projects", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminListProjectsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const status = parsed.success ? (parsed.data.status ?? null) : null;
  const offset = (page - 1) * limit;

  const whereClause = status ? and(eq(projectsTable.status, status)) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(projectsTable).where(whereClause);

  const projects = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      description: projectsTable.description,
      category: projectsTable.category,
      status: projectsTable.status,
      isFeatured: projectsTable.isFeatured,
      imageUrl: projectsTable.imageUrl,
      userId: projectsTable.userId,
      ownerName: usersTable.name,
      createdAt: projectsTable.createdAt,
    })
    .from(projectsTable)
    .leftJoin(usersTable, eq(projectsTable.userId, usersTable.id))
    .where(whereClause)
    .orderBy(desc(projectsTable.createdAt))
    .offset(offset)
    .limit(limit);

  const projectIds = projects.map((p) => p.id);
  const voteCounts: Record<number, number> = {};
  if (projectIds.length > 0) {
    const vcRows = await db
      .select({ projectId: votesTable.projectId, vc: count() })
      .from(votesTable)
      .groupBy(votesTable.projectId);
    for (const row of vcRows) {
      if (row.projectId !== null) voteCounts[row.projectId] = Number(row.vc);
    }
  }

  res.json({
    projects: projects.map((p) => ({
      ...p,
      ownerName: p.ownerName ?? "Unknown",
      voteCount: voteCounts[p.id] ?? 0,
    })),
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  });
});

router.get("/admin/payments", requireAuth, requireAdmin, async (req, res): Promise<void> => {
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
    .orderBy(desc(paymentsTable.createdAt));

  res.json(payments.map((p) => ({
    ...p,
    projectTitle: p.projectTitle ?? null,
    userEmail: p.userEmail ?? null,
  })));
});

router.get("/admin/analytics", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(usersTable);
  const [{ totalProjects }] = await db.select({ totalProjects: count() }).from(projectsTable);
  const [{ totalVotes }] = await db.select({ totalVotes: count() }).from(votesTable);

  const [{ totalRevenue }] = await db
    .select({ totalRevenue: sum(paymentsTable.amount) })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "completed"));

  const [{ pendingProjects }] = await db
    .select({ pendingProjects: count() })
    .from(projectsTable)
    .where(eq(projectsTable.status, "pending"));

  const [{ approvedProjects }] = await db
    .select({ approvedProjects: count() })
    .from(projectsTable)
    .where(eq(projectsTable.status, "approved"));

  const [{ rejectedProjects }] = await db
    .select({ rejectedProjects: count() })
    .from(projectsTable)
    .where(eq(projectsTable.status, "rejected"));

  const [{ featuredProjects }] = await db
    .select({ featuredProjects: count() })
    .from(projectsTable)
    .where(eq(projectsTable.isFeatured, true));

  res.json({
    totalUsers: Number(totalUsers),
    totalProjects: Number(totalProjects),
    totalVotes: Number(totalVotes),
    totalRevenue: Number(totalRevenue ?? 0),
    pendingProjects: Number(pendingProjects),
    approvedProjects: Number(approvedProjects),
    rejectedProjects: Number(rejectedProjects),
    featuredProjects: Number(featuredProjects),
  });
});

export default router;
