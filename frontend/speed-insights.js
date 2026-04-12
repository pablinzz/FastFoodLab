// Import and initialize Vercel Speed Insights
import { injectSpeedInsights } from 'https://cdn.jsdelivr.net/npm/@vercel/speed-insights@2/+esm';

// Initialize Speed Insights
injectSpeedInsights({
    debug: true // Enable debug logging in development
});
