import { createRoot } from 'react-dom/client';

import { LSystemDemoComponent } from './LSystemDemoComponent';

addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const el = document.getElementById("app-root");
    const root = createRoot(el || body);
    root.render(<LSystemDemoComponent/>);
});
