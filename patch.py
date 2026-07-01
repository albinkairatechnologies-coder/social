import os
import re

files_to_patch = {
    'app/api/ai/copilot/route.ts': [
        (r'where:\s*\{\s*userId\s*\}', r'where: { clientId: req.headers.get(\"x-client-id\") || \"legacy-client\" }'),
        (r'p\.analytics\.forEach\(a => \{', r'if (p.analytics) p.analytics.forEach((a: any) => {')
    ],
    'app/api/ai/image/route.ts': [
        (r'userId:\s*session\.user\.id,', r'clientId: req.headers.get(\"x-client-id\") || \"legacy-client\",')
    ],
    'app/api/auth/callback/facebook/route.ts': [
        (r'userId:\s*session\.user\.id,', r'clientId: \"legacy-client\",')
    ],
    'app/api/auth/callback/instagram/route.ts': [
        (r'userId:\s*session\.user\.id,', r'clientId: \"legacy-client\",')
    ],
    'app/api/auth/callback/linkedin/route.ts': [
        (r'userId:\s*session\.user\.id,', r'clientId: \"legacy-client\",')
    ],
    'app/api/auth/disconnect/route.ts': [
        (r'userId:\s*user\.id,', r'// removed userId')
    ],
    'app/api/auth/manual-connect/route.ts': [
        (r'userId:\s*session\.user\.id,', r'clientId: \"legacy-client\",')
    ],
    'app/api/auth/mock-connect/route.ts': [
        (r'userId,', r'clientId: \"legacy-client\",')
    ],
    'app/api/media/route.ts': [
        (r'where:\s*\{\s*userId\s*\}', r'where: { clientId: \"legacy-client\" }')
    ],
    'app/api/posts/comments/route.ts': [
        (r'post\.userId !== userId', r'post.clientId !== \"legacy-client\"')
    ],
    'app/api/posts/route.ts': [
        (r'userId:\s*session\.user\.id,', r'clientId: req.headers.get(\"x-client-id\") || \"legacy-client\",'),
        (r'post\.userId !== session\.user\.id', r'post.clientId !== (req.headers.get(\"x-client-id\") || \"legacy-client\")'),
        (r'where:\s*\{\s*userId:\s*session\.user\.id,\s*id:\s*mediaId\s*\}', r'where: { clientId: req.headers.get(\"x-client-id\") || \"legacy-client\", id: mediaId }')
    ],
    'app/api/upload/route.ts': [
        (r'userId:\s*session\.user\.id,', r'clientId: req.headers.get(\"x-client-id\") || \"legacy-client\",')
    ],
    'lib/queue.ts': [
        (r'userId:\s*post\.userId,', r'clientId: post.clientId,')
    ]
}

for filepath, patches in files_to_patch.items():
    if not os.path.exists(filepath):
        print(f'File not found: {filepath}')
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    for search, replace in patches:
        content = re.sub(search, replace, content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Patched {filepath}')

