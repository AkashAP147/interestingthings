import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { analyzeDiscovery } from '@/lib/ai-engine';
import { addDiscovery, readDB } from '@/lib/db';
import { Discovery } from '@/types';

// Fallback data in case Reddit blocks the scraper (very common without full OAuth)
const FALLBACK_SCRAPE_DATA = [
  {
    title: "A bizarre interactive map of global wind patterns",
    url: "https://earth.nullschool.net/",
    selftext: "This website shows global wind patterns in real-time. It is absolutely mesmerizing and beautiful. It feels like watching a living planet."
  },
  {
    title: "A genius tool that removes backgrounds using local AI",
    url: "https://example.com/bg-remover",
    selftext: "You can drag and drop images and this site removes the background entirely in your browser. No server uploads. Brilliant and secure."
  },
  {
    title: "The strange history of abandoned Soviet monuments",
    url: "https://example.com/soviet-monuments",
    selftext: "A fascinating photographic journey through massive, forgotten concrete monuments scattered across Eastern Europe."
  },
  {
    title: "Boring text",
    url: "",
    selftext: "This is just a normal post about something very standard. No interesting keywords here."
  }
];

export async function GET() {
  try {
    let rawPosts = [];
    
    // Scrape real-time data from Hacker News (Show HN)
    try {
      const response = await fetch('https://hn.algolia.com/api/v1/search_by_date?tags=show_hn&hitsPerPage=15', {
        headers: { 'User-Agent': 'Node/AI-Scraper-Engine v1.1' },
        next: { revalidate: 0 }
      });
      
      if (response.ok) {
        const data = await response.json();
        rawPosts = data.hits.map((h: any) => ({
          title: h.title.replace(/^Show HN:\s*/i, ''),
          url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
          selftext: h.story_text ? (h.story_text.replace(/<[^>]*>?/gm, '')) : `A new project or website shared on Hacker News: ${h.title}.`
        }));
      } else {
        throw new Error('Hacker News API request failed');
      }
    } catch (e) {
      console.log('Using fallback scraper data due to fetch error:', e);
      rawPosts = FALLBACK_SCRAPE_DATA;
    }

    const currentDB = await readDB();
    const existingUrls = new Set(currentDB.map(d => d.sourceUrl));
    
    const processed = [];
    const added = [];

    for (const post of rawPosts) {
      // 1. Skip if we already have it
      if (existingUrls.has(post.url) || !post.url) {
        processed.push({ title: post.title, status: 'skipped', reason: 'Duplicate or missing URL' });
        continue;
      }

      // 2. Custom AI Evaluation
      const aiAnalysis = analyzeDiscovery(post.title, post.selftext, post.url);

      if (aiAnalysis.isInteresting) {
        const newDiscovery: Discovery = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title: post.title,
          slug: post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
          description: post.selftext.substring(0, 150) + (post.selftext.length > 150 ? "..." : ""),
          content: post.selftext,
          categoryId: aiAnalysis.suggestedCategoryId,
          // Use real website screenshots for previews
          imageUrl: `https://image.thum.io/get/width/1200/crop/800/${post.url}`,
          sourceUrl: post.url,
          tags: aiAnalysis.suggestedTags,
          score: aiAnalysis.score,
          views: 0,
          saves: 0,
          shares: 0,
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          status: "pending_approval",
          featured: false
        };

        await addDiscovery(newDiscovery);
        added.push(newDiscovery);
        processed.push({ title: post.title, status: 'queued', score: aiAnalysis.score });
      } else {
        processed.push({ title: post.title, status: 'rejected', reason: 'Low AI Score', score: aiAnalysis.score });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scraping complete. Found ${rawPosts.length} items. Queued ${added.length} for approval.`,
      details: processed
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
