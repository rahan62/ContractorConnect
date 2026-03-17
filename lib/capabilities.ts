import { prisma } from "@/lib/prisma";
import { capabilityCatalog, type CapabilitySeedNode } from "@/lib/capability-catalog";

async function upsertNode(node: CapabilitySeedNode, parentId: string | null, sortOrder: number) {
  const current = await prisma.capabilityCategory.upsert({
    where: { slug: node.slug },
    update: {
      name: node.name,
      description: node.description ?? null,
      parentId,
      sortOrder
    },
    create: {
      slug: node.slug,
      name: node.name,
      description: node.description ?? null,
      parentId,
      sortOrder
    }
  });

  if (node.children?.length) {
    for (let index = 0; index < node.children.length; index += 1) {
      await upsertNode(node.children[index], current.id, index);
    }
  }
}

export async function syncCapabilityCatalog() {
  for (let index = 0; index < capabilityCatalog.length; index += 1) {
    await upsertNode(capabilityCatalog[index], null, index);
  }
}

export async function getCapabilityTree() {
  const categories = await prisma.capabilityCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });

  const byParent = new Map<string | null, typeof categories>();

  for (const category of categories) {
    const key = category.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(category);
    byParent.set(key, list);
  }

  const build = (parentId: string | null): Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    children: ReturnType<typeof build>;
  }> =>
    (byParent.get(parentId) ?? []).map(category => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      children: build(category.id)
    }));

  return build(null);
}
