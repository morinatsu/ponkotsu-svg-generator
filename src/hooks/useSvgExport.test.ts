import { renderHook } from '@testing-library/react';
import { useSvgExport } from './useSvgExport';
import { vi, afterEach, beforeEach, describe, it, expect } from 'vitest';

// Mock URL.createObjectURL and URL.revokeObjectURL as they don't exist in JSDOM
if (typeof URL.createObjectURL === 'undefined') {
  Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(), writable: true });
  Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
}

// Helper to read Blob content in a testing environment
const readBlobAsText = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
};

describe('useSvgExport', () => {
  let container: HTMLDivElement;

  // Create a fresh container before each test
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  // Clean up the container and restore mocks after each test
  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  const createMockSvg = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const selectedElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    selectedElement.setAttribute('stroke', 'blue');
    svg.appendChild(selectedElement);
    return { svg, selectedElement };
  };

  it('should not do anything if svgRef.current is null', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
    const { result } = renderHook(() => useSvgExport({ current: null }), { container });

    result.current.handleExport();

    expect(createObjectURLSpy).not.toHaveBeenCalled();
  });

  it('should export the SVG content as a file', () => {
    const { svg } = createMockSvg();
    const mockRef = { current: svg };

    const mockAnchor = document.createElement('a');
    const clickSpy = vi.spyOn(mockAnchor, 'click').mockImplementation(() => {});
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('mock-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

    const { result } = renderHook(() => useSvgExport(mockRef), { container });
    result.current.handleExport();

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('image/svg+xml');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockAnchor.href).toContain('mock-url');
    expect(mockAnchor.download).toBe('ponkotsu.svg');

    expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('mock-url');
  });

  it('should reset selection styles on the exported SVG', async () => {
    const { svg, selectedElement } = createMockSvg();
    const mockRef = { current: svg };

    const mockAnchor = document.createElement('a');
    vi.spyOn(mockAnchor, 'click').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    vi.spyOn(document.body, 'appendChild');
    vi.spyOn(document.body, 'removeChild');
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('mock-url');
    vi.spyOn(URL, 'revokeObjectURL');

    const { result } = renderHook(() => useSvgExport(mockRef), { container });
    result.current.handleExport();

    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    const svgText = await readBlobAsText(blob);

    expect(svgText).not.toContain('stroke="blue"');
    expect(svgText).toContain('stroke="black"');
    expect(selectedElement.getAttribute('stroke')).toBe('blue');
  });
});