import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Migrating snippets to Default Workspace ---');

  // 1. Locate or create "Default Workspace"
  let defaultWorkspace = await prisma.workspace.findFirst({
    where: { name: 'Default Workspace' },
  });

  if (!defaultWorkspace) {
    console.log('No "Default Workspace" found. Creating one...');
    defaultWorkspace = await prisma.workspace.create({
      data: { name: 'Default Workspace' },
    });
    console.log(`Created Default Workspace with ID: ${defaultWorkspace.id}`);
  } else {
    console.log(`Found Default Workspace: "${defaultWorkspace.name}" (ID: ${defaultWorkspace.id})`);
  }

  // 2. Find all snippets without workspaceId
  const unassignedSnippets = await prisma.snippet.findMany({
    where: {
      OR: [
        { workspaceId: null },
      ],
    },
    select: { id: true, title: true, workspaceId: true },
  });

  console.log(`Found ${unassignedSnippets.length} snippets without workspace.`);

  if (unassignedSnippets.length === 0) {
    console.log('All snippets are already assigned to a workspace. Nothing to migrate.');
    return;
  }

  // 3. Batch update snippets to point to Default Workspace
  const result = await prisma.snippet.updateMany({
    where: {
      OR: [
        { workspaceId: null },
      ],
    },
    data: {
      workspaceId: defaultWorkspace.id,
    },
  });

  console.log(`Successfully migrated ${result.count} snippets to Default Workspace:`);
  for (const s of unassignedSnippets) {
    console.log(` - [${s.id}] ${s.title}`);
  }

  // 4. Verify count
  const updatedCount = await prisma.snippet.count({
    where: { workspaceId: defaultWorkspace.id },
  });
  console.log(`Default Workspace now contains ${updatedCount} snippets.`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
