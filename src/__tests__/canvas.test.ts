import { describe, it, expect } from 'vitest';
import {
  screenToCanvasCoordinates,
  canvasToScreenCoordinates,
  clampZoom,
  calculateConnectorPath
} from '../components/CanvasView';

describe('Canvas Unit Tests: Transformations & Connector Math', () => {
  describe('screenToCanvasCoordinates', () => {
    it('converts screen coordinates to canvas coordinates with 1x zoom and 0 pan', () => {
      const res = screenToCanvasCoordinates(200, 150, 0, 0, 1);
      expect(res).toEqual({ x: 200, y: 150 });
    });

    it('accounts for viewport panning offset', () => {
      const res = screenToCanvasCoordinates(250, 180, 50, 30, 1);
      expect(res).toEqual({ x: 200, y: 150 });
    });

    it('accounts for zoom scale factor', () => {
      const res = screenToCanvasCoordinates(400, 300, 0, 0, 2);
      expect(res).toEqual({ x: 200, y: 150 });
    });

    it('handles combined panning and zooming', () => {
      // Screen = 450, 330; Pan = 50, 30; Zoom = 2 => (450-50)/2 = 200, (330-30)/2 = 150
      const res = screenToCanvasCoordinates(450, 330, 50, 30, 2);
      expect(res).toEqual({ x: 200, y: 150 });
    });
  });

  describe('canvasToScreenCoordinates', () => {
    it('converts canvas coordinates to screen coordinates with 1x zoom and 0 pan', () => {
      const res = canvasToScreenCoordinates(100, 80, 0, 0, 1);
      expect(res).toEqual({ x: 100, y: 80 });
    });

    it('applies panning offset correctly', () => {
      const res = canvasToScreenCoordinates(100, 80, 40, 20, 1);
      expect(res).toEqual({ x: 140, y: 100 });
    });

    it('applies zoom scaling factor correctly', () => {
      const res = canvasToScreenCoordinates(100, 80, 0, 0, 1.5);
      expect(res).toEqual({ x: 150, y: 120 });
    });

    it('combines zoom scaling and panning translation accurately', () => {
      const res = canvasToScreenCoordinates(100, 80, 50, 25, 2);
      expect(res).toEqual({ x: 250, y: 185 });
    });
  });

  describe('clampZoom', () => {
    it('returns zoom unchanged when within limits', () => {
      expect(clampZoom(1.0)).toBe(1.0);
      expect(clampZoom(0.5)).toBe(0.5);
    });

    it('clamps zoom to minZoom if below minimum', () => {
      expect(clampZoom(0.1, 0.2, 2.5)).toBe(0.2);
    });

    it('clamps zoom to maxZoom if above maximum', () => {
      expect(clampZoom(3.0, 0.2, 2.5)).toBe(2.5);
    });
  });

  describe('calculateConnectorPath', () => {
    const fromNode = { x: 100, y: 100, width: 200, height: 100 };
    const toNode = { x: 500, y: 300, width: 200, height: 100 };

    it('calculates start and end center points for unscaled/unpanned nodes', () => {
      const res = calculateConnectorPath(fromNode, toNode, 1, { x: 0, y: 0 });

      // center from: (100+100, 100+50) = (200, 150)
      // center to: (500+100, 300+50) = (600, 350)
      expect(res.startX).toBe(200);
      expect(res.startY).toBe(150);
      expect(res.endX).toBe(600);
      expect(res.endY).toBe(350);
    });

    it('generates a valid SVG cubic bezier curve string format M ... C ...', () => {
      const res = calculateConnectorPath(fromNode, toNode, 1, { x: 0, y: 0 });
      expect(res.pathData).toMatch(/^M 200,150 C \d+(\.\d+)?,150 \d+(\.\d+)?,350 600,350$/);
    });

    it('scales connector coordinates correctly when zoomed', () => {
      const res = calculateConnectorPath(fromNode, toNode, 2, { x: 0, y: 0 });
      expect(res.startX).toBe(400);
      expect(res.startY).toBe(300);
      expect(res.endX).toBe(1200);
      expect(res.endY).toBe(700);
    });

    it('translates connector coordinates correctly when panned', () => {
      const res = calculateConnectorPath(fromNode, toNode, 1, { x: 50, y: 25 });
      expect(res.startX).toBe(250);
      expect(res.startY).toBe(175);
      expect(res.endX).toBe(650);
      expect(res.endY).toBe(375);
    });
  });
});
