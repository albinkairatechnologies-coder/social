const fs = require('fs');
const path = require('path');

const filesToPatch = {
    'app/api/ai/copilot/route.ts': [
        { search: /where:\s*\{\s*userId\s*\}/g, replace: 'where: { clientId: req.headers.get("x-client-id") || "legacy-client" }' },
        { search: /p\.analytics\.forEach\(a => \{/g, replace: 'if (p.analytics) p.analytics.forEach((a: any) => {' }
    ],
    'app/api/ai/image/route.ts': [
        { search: /userId:\s*session\.user\.id,/g, replace: 'clientId: req.headers.get("x-client-id") || "legacy-client",' }
    ],
    'app/api/auth/callback/facebook/route.ts': [
        { search: /userId:\s*session\.user\.id,/g, replace: 'clientId: "legacy-client",' }
    ],
    'app/api/auth/callback/instagram/route.ts': [
        { search: /userId:\s*session\.user\.id,/g, replace: 'clientId: "legacy-client",' }
    ],
    'app/api/auth/callback/linkedin/route.ts': [
        { search: /userId:\s*session\.user\.id,/g, replace: 'clientId: "legacy-client",' }
    ],
    'app/api/auth/disconnect/route.ts': [
        { search: /userId:\s*user\.id,/g, replace: '// removed userId' }
    ],
    'app/api/auth/manual-connect/route.ts': [
        { search: /userId:\s*session\.user\.id,/g, replace: 'clientId: "legacy-client",' }
    ],
    'app/api/auth/mock-connect/route.ts': [
        { search: /userId,/g, replace: 'clientId: "legacy-client",' }
    ],
    'app/api/media/route.ts': [
        { search: /where:\s*\{\s*userId\s*\}/g, replace: 'where: { clientId: "legacy-client" }' }
    ],
    'app/api/posts/comments/route.ts': [
        { search: /post\.userId !== userId/g, replace: 'post.clientId !== "legacy-client"' }
    ],
    'app/api/posts/route.ts': [
        { search: /userId:\s*session\.user\.id,/g, replace: 'clientId: req.headers.get("x-client-id") || "legacy-client",' },
        { search: /post\.userId !== session\.user\.id/g, replace: 'post.clientId !== (req.headers.get("x-client-id") || "legacy-client")' },
        { search: /where:\s*\{\s*userId:\s*session\.user\.id,\s*id:\s*mediaId\s*\}/g, replace: 'where: { clientId: req.headers.get("x-client-id") || "legacy-client", id: mediaId }' }
    ],
    'app/api/upload/route.ts': [
        { search: /userId:\s*session\.user\.id,/g, replace: 'clientId: req.headers.get("x-client-id") || "legacy-client",' }
    ],
    'lib/queue.ts': [
        { search: /userId:\s*post\.userId,/g, replace: 'clientId: post.clientId,' }
    ]
};

for (const [filepath, patches] of Object.entries(filesToPatch)) {
    const fullPath = path.join(process.cwd(), filepath);
    if (!fs.existsSync(fullPath)) {
        console.log('File not found:', filepath);
        continue;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    for (const { search, replace } of patches) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Patched', filepath);
}
