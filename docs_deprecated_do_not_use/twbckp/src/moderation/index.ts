/**
 * Moderation Dashboard Entry Point
 */

import Moderation from './Moderation.svelte';
import '../shared/styles/global.css';

const app = new Moderation({
  target: document.getElementById('app')!,
});

export default app;
