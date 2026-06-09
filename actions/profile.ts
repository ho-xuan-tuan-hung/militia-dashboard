"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Militia from "@/models/Militia";
import type { MilitiaFormData } from "@/types";

function serialize<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

export async function getMyMilitiaProfile(): Promise<MilitiaFormData | null> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "dan_quan") return null;
  if (!session.user.militiaId) return null;

  await connectDB();
  const doc = await Militia.findById(session.user.militiaId).lean();
  if (!doc) return null;

  return serialize(doc) as unknown as MilitiaFormData;
}
