<script>
  import '../app.css';
  import { onMount } from 'svelte';

  // ⚡ PERFORMANCE FIX: Service Worker temporarily disabled due to corruption issues
  // TODO: Re-implement with proper Workbox or modern caching strategy
  onMount(() => {
    // Unregister any existing service workers to fix corruption
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          console.log('🧹 Unregistered buggy service worker');
        });
      });
    }
  });
</script>

<slot />
