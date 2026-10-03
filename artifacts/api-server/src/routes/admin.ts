import { Router } from "express";
import { getAdminRoomsSnapshot } from "../game/socket";

const router = Router();

router.get("/admin/rooms", (req, res) => {
  if (!req.isAdmin()) {
    res.status(401).json({ message: "Admin authentication required." });
    return;
  }
  res.json({ rooms: getAdminRoomsSnapshot() });
});

export default router;