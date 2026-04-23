import { Router, type IRouter } from "express";
import { db, projectsTable, usersTable, votesTable } from "@workspace/db";
import { eq, desc, ilike, and, sql, count } from "drizzle-orm";
import {
  CreateProjectBody,
  GetProjectParams,
  ApproveProjectParams,
  RejectProjectParams,
  ListProjectsQueryParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

type AuthReq = { user?: { userId: number; email: string; role: string } };

const router: IRouter = Router();

router.get("/projects/stats/categories", async (_req, res): Promise<void> => {
  const stats = await db
    .select({ category: projectsTable.category, count: count() })
    .from(projectsTable)
    .where(eq(projectsTable.status, "approved"))
    .groupBy(projectsTable.category)
    .orderBy(desc(count()));

  res.json(stats.map((s) => ({ category: s.category, count: Number(s.count) })));
});

router.get("/projects/stats/top-voted", async (req, res): Promise<void> => {
  const parsed = ListProjectsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 5) : 5;

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
      voteCount: sql<number>`COUNT(${votesTable.id})::int`,
    })
    .from(projectsTable)
    .leftJoin(usersTable, eq(projectsTable.userId, usersTable.id))
    .leftJoin(votesTable, eq(votesTable.projectId, projectsTable.id))
    .where(eq(projectsTable.status, "approved"))
    .groupBy(projectsTable.id, usersTable.name)
    .orderBy(desc(sql`COUNT(${votesTable.id})`))
    .limit(limit);

  res.json(projects.map((p) => ({
    ...p,
    ownerName: p.ownerName ?? "Unknown",
  })));
});

router.get("/projects", async (req, res): Promise<void> => {
  const parsed = ListProjectsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 12) : 12;
  const search = parsed.success ? parsed.data.search ?? null : null;
  const category = parsed.success ? parsed.data.category ?? null : null;
  const sort = parsed.success ? (parsed.data.sort ?? "featured") : "featured";
  const offset = (page - 1) * limit;

  const conditions = [eq(projectsTable.status, "approved")];
  if (search) conditions.push(ilike(projectsTable.title, `%${search}%`));
  if (category) conditions.push(eq(projectsTable.category, category));

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(projectsTable)
    .where(whereClause);

  const baseQuery = db
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
      voteCount: sql<number>`COUNT(${votesTable.id})::int`,
    })
    .from(projectsTable)
    .leftJoin(usersTable, eq(projectsTable.userId, usersTable.id))
    .leftJoin(votesTable, eq(votesTable.projectId, projectsTable.id))
    .where(whereClause)
    .groupBy(projectsTable.id, usersTable.name);

  let projects;
  if (sort === "votes") {
    projects = await baseQuery
      .orderBy(desc(projectsTable.isFeatured), desc(sql`COUNT(${votesTable.id})`))
      .offset(offset)
      .limit(limit);
  } else if (sort === "featured") {
    projects = await baseQuery
      .orderBy(desc(projectsTable.isFeatured), desc(projectsTable.createdAt))
      .offset(offset)
      .limit(limit);
  } else {
    projects = await baseQuery
      .orderBy(desc(projectsTable.isFeatured), desc(projectsTable.createdAt))
      .offset(offset)
      .limit(limit);
  }

  const totalPages = Math.ceil(Number(total) / limit);
  res.json({
    projects: projects.map((p) => ({ ...p, ownerName: p.ownerName ?? "Unknown" })),
    total: Number(total),
    page,
    limit,
    totalPages,
  });
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & AuthReq;
  const userId = authReq.user!.userId;

  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, category, imageUrl } = parsed.data;

  const [project] = await db
    .insert(projectsTable)
    .values({ title, description, category, imageUrl: imageUrl ?? null, userId, status: "pending", isFeatured: false })
    .returning();

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));

  res.status(201).json({
    ...project,
    voteCount: 0,
    ownerName: user?.name ?? "Unknown",
  });
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
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
      voteCount: sql<number>`COUNT(${votesTable.id})::int`,
    })
    .from(projectsTable)
    .leftJoin(usersTable, eq(projectsTable.userId, usersTable.id))
    .leftJoin(votesTable, eq(votesTable.projectId, projectsTable.id))
    .where(eq(projectsTable.id, params.data.id))
    .groupBy(projectsTable.id, usersTable.name);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json({ ...project, ownerName: project.ownerName ?? "Unknown" });
});

router.put("/projects/:id/approve", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = ApproveProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set({ status: "approved" })
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, project.userId));
  const [{ vc }] = await db.select({ vc: count() }).from(votesTable).where(eq(votesTable.projectId, project.id));

  res.json({ ...project, voteCount: Number(vc), ownerName: user?.name ?? "Unknown" });
});

router.put("/projects/:id/reject", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = RejectProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set({ status: "rejected" })
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, project.userId));
  const [{ vc }] = await db.select({ vc: count() }).from(votesTable).where(eq(votesTable.projectId, project.id));

  res.json({ ...project, voteCount: Number(vc), ownerName: user?.name ?? "Unknown" });
});

export default router;
