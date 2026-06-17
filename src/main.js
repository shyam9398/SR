// 1. Core state registration
import appState from './core/appState.js';
window.APP = appState;

// 2. Load legacy base scripts (so they initialize their globals and DOM structure)
import './legacy/legacy-app.js';
import './legacy/legacy-patches.js';
import './legacy/aimeasy-fixes.js';

// 3. Load other legacy fixes
import { installCriticalFixes } from './legacy/installCriticalFixes.js';
import { installSubAdminFixes } from './legacy/installSubAdminFixes.js';
import { installAdminSubjectCrud } from './legacy/installAdminSubjectCrud.js';
import { installIntroSplash } from './legacy/installIntroSplash.js';
import { installBackButtonFixes } from './legacy/installBackButtonFixes.js';

// Apply legacy fixes immediately to define globals
installBackButtonFixes();
installCriticalFixes();
installSubAdminFixes();
installAdminSubjectCrud();
installIntroSplash();

// 4. Load compatibility bridge adapters (these overwrite legacy globals with modular equivalents)
import './legacy/subjects.bridge.js';
import './legacy/videos.bridge.js';
import './legacy/notes.bridge.js';
import './legacy/roadmap.bridge.js';
import './legacy/units.bridge.js';
import './legacy/calculator.bridge.js';
import './legacy/auth.bridge.js';
import './legacy/admin.bridge.js';
import './legacy/subadmin.bridge.js';
import './legacy/chat.bridge.js';
import './legacy/pyqs.bridge.js';
import './legacy/important-questions.bridge.js';
import './legacy/student.bridge.js';

console.log('[main.js] Modularized AIIENS Edu bootstrapped successfully.');
