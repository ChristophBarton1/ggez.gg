<script>
  import '../app.css';
  import { onMount } from 'svelte';

  // Register Service Worker for aggressive caching
  onMount(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }
  });
</script>

<slot />
