import { Router, type IRouter } from "express";
import { db, votesTable, projectsTable } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";
import { VoteProjectParams, GetMyVoteParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

type AuthReq = { user?: { userId: number; email: string; role: string } };

const router: IRouter = Router();

router.post("/projects/:id/vote", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & AuthReq;
  const userId = authReq.user!.userId;

  const params = VoteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const projectId = params.data.id;

  const [project] = await db.select({ id: projectsTable.id }).from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [existingVote] = await db
    .select()
    .from(votesTable)
    .where(and(eq(votesTable.userId, userId), eq(votesTable.projectId, projectId)));

  let voted: boolean;
  if (existingVote) {
    await db.delete(votesTable).where(eq(votesTable.id, existingVote.id));
    voted = false;
  } else {
    await db.insert(votesTable).values({ userId, projectId });
    voted = true;
  }

  const [{ vc }] = await db.select({ vc: count() }).from(votesTable).where(eq(votesTable.projectId, projectId));

  res.json({ voted, voteCount: Number(vc) });
});

router.get("/projects/:id/my-vote", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & AuthReq;
  const userId = authReq.user!.userId;

  const params = GetMyVoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [vote] = await db
    .select()
    .from(votesTable)
    .where(and(eq(votesTable.userId, userId), eq(votesTable.projectId, params.data.id)));

  res.json({ voted: !!vote });
});

export default router;
