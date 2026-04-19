const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes('@/app/context/AuthContext') || content.includes('@/app/context/FavoritesContext') || content.includes('@/app/context/ChatBoxContext')) {

        // auth
        const prev1 = content;
        content = content.replace(/import\s+\{\s*useAuth\s*\}\s+from\s+['"]@\/app\/context\/AuthContext['"]/g, "import { useAuth } from '@/app/context/useAuth'");
        if (content !== prev1) changed = true;

        // favorites
        const prev2 = content;
        content = content.replace(/import\s+\{\s*useFavorites\s*\}\s+from\s+['"]@\/app\/context\/FavoritesContext['"]/g, "import { useFavorites } from '@/app/context/useFavorites'");
        if (content !== prev2) changed = true;

        // chatbox
        const prev3 = content;
        content = content.replace(/import\s+\{\s*useChatBox\s*\}\s+from\s+['"]@\/app\/context\/ChatBoxContext['"]/g, "import { useChatBox } from '@/app/context/useChatBox'");
        if (content !== prev3) changed = true;

        if (changed) {
            fs.writeFileSync(file, content);
            console.log('Fixed:', file);
        }
    }
});
