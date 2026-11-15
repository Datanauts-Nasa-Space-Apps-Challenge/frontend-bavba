import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for NASA Moon Trek WMTS GetCapabilities
 * Avoids CORS issues and provides a stable endpoint for XML parsing.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const layerId = searchParams.get('layer');
  const projection = searchParams.get('proj') || 'EQ';

  if (!layerId) {
    return NextResponse.json({ error: 'Layer ID is required' }, { status: 400 });
  }

  // NASA Trek uses specific projection path segments in their URLs
  const url = `https://trek.nasa.gov/tiles/Moon/${projection}/${layerId}/1.0.0/WMTSCapabilities.xml`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (NavLunar GIS Engine)',
        'Accept': 'application/xml, text/xml'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`NASA Trek Error [${response.status}] for URL: ${url}`);
      return NextResponse.json(
        { error: `NASA Trek returned status ${response.status}`, url }, 
        { status: response.status }
      );
    }

    const xml = await response.text();
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    console.error('NASA Proxy Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
