/**
 * WMTS Capabilities Parser for NASA Trek
 */

export interface WmtsTileMatrix {
  id: string;
  scaleDenominator: number;
  topLeftCorner: [number, number];
  tileWidth: number;
  tileHeight: number;
  matrixWidth: number;
  matrixHeight: number;
}

export interface WmtsLayerMetadata {
  resourceUrl: string;
  style: string;
  matrixSet: string;
  matrices: WmtsTileMatrix[];
  format: string;
}

export async function fetchWmtsMetadata(
  layerId: string,
  projection: string
): Promise<WmtsLayerMetadata | null> {
  try {
    const response = await fetch(
      `/api/moon-wmts/capabilities?layer=${encodeURIComponent(layerId)}&proj=${encodeURIComponent(projection)}`
    );

    if (!response.ok) {
      console.warn(`[NAVLUNAR GIS] Layer metadata not available: ${layerId} (${response.status})`);
      return null;
    }

    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');

    const parseError = xml.querySelector('parsererror');
    if (parseError) {
      console.error(`[NAVLUNAR GIS] XML Parse Error for ${layerId}`);
      return null;
    }

    const resourceUrl = xml.querySelector('ResourceURL[format*="image"]')?.getAttribute('template') || '';
    const format = xml.querySelector('ResourceURL[format*="image"]')?.getAttribute('format') || 'image/png';

    const layers = Array.from(xml.querySelectorAll('Layer'));
    const layerNode = layers.find((l) => l.querySelector('Identifier')?.textContent === layerId) || layers[0];

    if (!layerNode) return null;

    const style = layerNode.querySelector('Style > Identifier')?.textContent || 'default';
    const matrixSet = layerNode.querySelector('TileMatrixSetLink > TileMatrixSet')?.textContent || '';

    const matrixSets = Array.from(xml.querySelectorAll('TileMatrixSet'));
    const matrixSetNode = matrixSets.find((ms) => ms.querySelector('Identifier')?.textContent === matrixSet);

    if (!matrixSetNode) return null;

    const matrices: WmtsTileMatrix[] = Array.from(matrixSetNode.querySelectorAll('TileMatrix')).map((m) => {
      const topLeft = m.querySelector('TopLeftCorner')?.textContent?.trim().split(/\s+/).map(Number) || [0, 0];
      return {
        id: m.querySelector('Identifier')?.textContent || '',
        scaleDenominator: Number(m.querySelector('ScaleDenominator')?.textContent),
        topLeftCorner: [topLeft[0], topLeft[1]],
        tileWidth: Number(m.querySelector('TileWidth')?.textContent),
        tileHeight: Number(m.querySelector('TileHeight')?.textContent),
        matrixWidth: Number(m.querySelector('MatrixWidth')?.textContent),
        matrixHeight: Number(m.querySelector('MatrixHeight')?.textContent),
      };
    });

    return { resourceUrl, style, matrixSet, matrices, format };
  } catch (error) {
    console.warn(`[NAVLUNAR GIS] Failed to resolve WMTS metadata: ${layerId}`);
    return null;
  }
}
