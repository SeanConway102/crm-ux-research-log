# Memory Graph

Maintain a knowledge graph at `memory/graph.md` tracking entities and their relationships.

## Graph Format

Use markdown sections for entity types, **bold names** with [tags], and `- relationship: target` for edges:

```markdown
## People
- **Sean Conway** [Lead Engineer, CT Website Co]
  - manages: CRM Backend, all client sites
  - prefers: concise mobile updates, emoji status
  - timezone: America/New_York

## Projects
- **CRM Backend** [Go, Cloud Run]
  - repo: ctwebsiteco/crm
  - depends-on: Neon Postgres, Redis
  - deployed-to: Google Cloud Run (us-east1)

## Clients
- **Pals Power Washing** [Client Site]
  - url: palspowerwashing.com
  - repo: ctwebsiteco/v0-pals-power-washing-website
  - hosting: Vercel
  - lighthouse: 95+ (was 67)
  - last-fix: 2026-03-29 image optimization

## Decisions
- **2026-03-29: Sharp for all image optimization**
  - applies-to: all v0-* client sites
  - pattern: install sharp, remove unoptimized:true, AVIF+WebP, quality 75

## Patterns
- **Image Optimization Fix** [Repeatable]
  - steps: pnpm add sharp, remove unoptimized:true, add formats config, build, verify Lighthouse
  - applied-to: Pals, Tax Career, Fairway, 3Cs, Lizhai, ctpolitics
```

## Operations

### Add Entity
When you learn about a new person, project, client, tool, or decision:
1. Read `memory/graph.md`
2. Add under the right section (create section if needed)
3. Add relationship links to existing entities
4. Write back

### Query
When asked "what do we know about X" or investigating context:
1. Search `memory/graph.md` for the entity
2. Follow relationships to related entities
3. Cross-reference with recent `memory/YYYY-MM-DD.md` files
4. Synthesize a complete picture

### Maintain
During dream cycles:
1. Review recent daily logs for new entities/relationships
2. Update graph with new info
3. Remove stale relationships (resolved tickets, completed one-off tasks)
4. Merge duplicate entities
5. Keep the graph under 300 lines
