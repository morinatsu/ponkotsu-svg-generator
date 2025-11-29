import { type RefObject } from 'react';

export const useSvgExport = (svgRef: RefObject<SVGSVGElement | null>) => {
  const handleExport = () => {
    if (svgRef.current) {
      const svgNode = svgRef.current.cloneNode(true) as SVGSVGElement;
      svgNode.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgNode.style.backgroundColor = 'white';

      // Reset selection styles for export
      const selectedElements = svgNode.querySelectorAll('[stroke="blue"]');
      selectedElements.forEach((element) => {
        element.setAttribute('stroke', 'black');
      });

      // Remove elements marked for ignore (rotation handles, hitboxes, etc.)
      const ignoredElements = svgNode.querySelectorAll('[data-export-ignore="true"]');
      ignoredElements.forEach((element) => {
        element.remove();
      });

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
