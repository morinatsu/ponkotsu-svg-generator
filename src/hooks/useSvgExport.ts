import { RefObject } from 'react';

export const useSvgExport = (svgRef: RefObject<SVGSVGElement>) => {
  const handleExport = () => {
    if (svgRef.current) {
      const svgNode = svgRef.current.cloneNode(true) as SVGSVGElement;
      svgNode.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgNode.style.backgroundColor = 'white';

      const svgContent = svgNode.outerHTML;
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ponkotsu.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return { handleExport };
};
