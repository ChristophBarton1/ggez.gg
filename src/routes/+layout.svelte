<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Navbar from '$lib/components/Navbar.svelte';

  export let data;

  // DEBUG: Log user data on every page load
  $: {
    console.log('🔍 Layout data:', {
      hasUser: !!data?.user,
      username: data?.user?.username,
      userId: data?.user?.id,
      pathname: $page.url.pathname
    });
  }

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
  
  $: isHomepage = $page.url.pathname === '/';
  $: isLegalPage = ['/impressum', '/privacy', '/legal'].includes($page.url.pathname);
</script>

<!-- Global Navbar on all pages except legal pages -->
{#if !isLegalPage}
  <Navbar {data} showSearchInNav={!isHomepage} />
{/if}

<!-- Page Content with automatic padding for fixed navbar -->
<div class="page-wrapper" class:has-navbar={!isLegalPage} class:is-homepage={isHomepage}>
  <slot />
</div>

<style>
  /* Automatic padding for ALL pages with navbar (except homepage) */
  .page-wrapper.has-navbar:not(.is-homepage) {
    padding-top: 80px;
  }
  
  /* Homepage handles its own padding */
  .page-wrapper.is-homepage {
    padding-top: 0;
  }
</style>
